package contract

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"          
	"github.com/SA/config"
	"github.com/SA/entity"
)


// ===== Types =====
type renewBody struct {
	Months    *int     `json:"months"`      // ไม่ส่ง -> 3
	StartDate *string  `json:"start_date"`  // "YYYY-MM-DD"
	EndDate   *string  `json:"end_date"`    // "YYYY-MM-DD" (ถ้าส่งมา จะไม่ใช้ months)
	Rate      *float64 `json:"rate"`        // ค่าเช่าใหม่ (optional)
}

// ===== Helpers =====
func parseYMD(s string) (time.Time, error) {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return t, err
	}
	// ให้เวลาเป็น 00:00:00
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.Local), nil
}
func addDays(t time.Time, days int) time.Time   { return t.AddDate(0, 0, days) }
func addMonths(t time.Time, m int) time.Time    { return t.AddDate(0, m, 0) }

// ===== Handlers =====

// GET /contracts  ?studentId=123
func ListContracts(c *gin.Context) {
	var contracts []entity.Contract
	db := config.DB()

	q := db.
		Preload("Billings").
		Preload("Room").
		Preload("Admin").
		Preload("Student").
		Order("start_date ASC")

	if sid := c.Query("studentId"); sid != "" {
		q = q.Where("student_id = ?", sid)
	}

	if err := q.Find(&contracts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, contracts)
}

// (หากยังต้องการตัวนี้ด้วย ให้คงไว้ แต่จริง ๆ ListContracts ก็พอแล้ว)
func GetContracts(c *gin.Context) {
	var contracts []entity.Contract
	if err := config.DB().
		Preload("Billings").
		Preload("Room").
		Preload("Admin").
		Preload("Student").
		Find(&contracts).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, contracts)
}

// PUT /contracts/:id/renew-request
func RenewRequest(c *gin.Context) {
	db := config.DB()
  
	var ct entity.Contract
	if err := db.First(&ct, c.Param("id")).Error; err != nil {
	  c.JSON(http.StatusNotFound, gin.H{"error": "contract not found"})
	  return
	}
  
	var body renewBody
	if err := c.ShouldBindJSON(&body); err != nil {
	  c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	  return
	}
  
	// คำนวณ start/end (คล้ายที่คุณทำใน Renew)
	var start time.Time
	if body.StartDate != nil && *body.StartDate != "" {
	  t, err := parseYMD(*body.StartDate)
	  if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error":"invalid start_date"}); return }
	  start = t
	} else {
	  start = addDays(ct.End_Date, 1)
	}
  
	var end time.Time
	if body.EndDate != nil && *body.EndDate != "" {
	  t, err := parseYMD(*body.EndDate)
	  if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error":"invalid end_date"}); return }
	  end = t
	} else {
	  m := 3
	  if body.Months != nil && *body.Months > 0 { m = *body.Months }
	  end = addMonths(start, m)
	}
  
	// เซ็ตสถานะคำขอค้างไว้ใน Contract เดิม
	status := "pending"
	ct.RenewalPending   = true
	ct.RenewalMonths    = body.Months
	ct.RenewalStartDate = &start
	ct.RenewalEndDate   = &end
	ct.RenewalRate      = body.Rate
	ct.RenewalStatus    = &status
  
	if err := db.Save(&ct).Error; err != nil {
	  c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	  return
	}
	c.JSON(http.StatusOK, ct)
  }
  
// PUT /contracts/:id/renew-approve
func RenewApprove(c *gin.Context) {
	db := config.DB()
  
	var ct entity.Contract
	if err := db.First(&ct, c.Param("id")).Error; err != nil {
	  c.JSON(http.StatusNotFound, gin.H{"error": "contract not found"})
	  return
	}
	if !ct.RenewalPending || ct.RenewalStatus == nil || *ct.RenewalStatus != "pending" {
	  c.JSON(http.StatusBadRequest, gin.H{"error": "no pending renewal on this contract"})
	  return
	}
  
	// ใช้ค่าที่ขอไว้
	start := *ct.RenewalStartDate
	end   := *ct.RenewalEndDate
	rate  := ct.Rate
	if ct.RenewalRate != nil { rate = *ct.RenewalRate }
  
	// (ออปชัน) เช็ค overlap room เหมือนเดิม
	if ct.Room_ID != nil {
	  var count int64
	  if err := db.Model(&entity.Contract{}).
		Where("room_id = ?", *ct.Room_ID).
		Where("start_date <= ? AND end_date >= ?", end, start).
		Count(&count).Error; err == nil && count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error":"date overlaps"})
		return
	  }
	}
  
	// สร้างสัญญาใหม่ (รักษาประวัติ)
	newCt := entity.Contract{
	  Start_Date: start,
	  End_Date:   end,
	  Rate:       rate,
	  Room_ID:    ct.Room_ID,
	  Admin_ID:   ct.Admin_ID,
	  StudentID:  ct.StudentID,
	}
	if err := db.Create(&newCt).Error; err != nil {
	  c.JSON(http.StatusInternalServerError, gin.H{"error": "create renewal failed: " + err.Error()})
	  return
	}
  
	// เคลียร์สถานะ pending ในสัญญาเดิม
	approved := "approved"
	ct.RenewalPending = false
	ct.RenewalStatus  = &approved
	if err := db.Save(&ct).Error; err != nil {
	  c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	  return
	}
  
	c.JSON(http.StatusOK, newCt)
  }

  
  // PUT /contracts/:id/renew-reject
func RenewReject(c *gin.Context) {
	db := config.DB()
	var ct entity.Contract
	if err := db.First(&ct, c.Param("id")).Error; err != nil {
	  c.JSON(http.StatusNotFound, gin.H{"error":"contract not found"})
	  return
	}
	if !ct.RenewalPending {
	  c.JSON(http.StatusBadRequest, gin.H{"error":"no pending renewal"})
	  return
	}
	rejected := "rejected"
	ct.RenewalPending = false
	ct.RenewalStatus  = &rejected
	ct.RenewalMonths = nil
	ct.RenewalStartDate, ct.RenewalEndDate, ct.RenewalRate = nil, nil, nil
  
	if err := db.Save(&ct).Error; err != nil {
	  c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	  return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
  }

  
  // ===== Create (optional ถ้าคุณกดเพิ่มจากหน้า UI) =====
func Create(c *gin.Context) {
    db := config.DB()
    var payload struct {
        StartDate string   `json:"start_date"`
        EndDate   string   `json:"end_date"`
        Rate      float64  `json:"rate"`
        StudentID uint     `json:"StudentID"`
        RoomID    *uint    `json:"Room_ID"`   // ถ้ามี
        AdminID   *uint    `json:"Admin_ID"`  // ถ้ามี
    }
    if err := c.ShouldBindJSON(&payload); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    s, err1 := parseYMD(payload.StartDate)
    e, err2 := parseYMD(payload.EndDate)
    if err1 != nil || err2 != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format (YYYY-MM-DD)"})
        return
    }

    ct := entity.Contract{
        Start_Date: s, End_Date: e, Rate: payload.Rate,
        StudentID: &payload.StudentID,
        Room_ID: payload.RoomID, Admin_ID: payload.AdminID,
    }
    if err := db.Create(&ct).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusCreated, ct)
}

// PUT /contracts/:id
func Update(c *gin.Context) {
	db := config.DB()

	var ct entity.Contract
	if err := db.First(&ct, c.Param("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "contract not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// รับค่าแบบ optional ทั้งหมด
	var body struct {
		StartDate      *string  `json:"start_date"`
		EndDate        *string  `json:"end_date"`
		Rate           *float64 `json:"rate"`
		StudentID      *uint    `json:"StudentID"`
		RoomID         *uint    `json:"Room_ID"`
		AdminID        *uint    `json:"Admin_ID"`

		// ฟิลด์สถานะต่อสัญญา
		RenewalStatus  *string  `json:"renewal_status"`      // "pending" | "approved" | "rejected"
		RenewalPending *bool    `json:"renewal_pending"`
		RenewalStart   *string  `json:"renewal_start_date"`  // "YYYY-MM-DD"
		RenewalEnd     *string  `json:"renewal_end_date"`    // "YYYY-MM-DD"
		RenewalMonths  *int     `json:"renewal_months"`
		RenewalRate    *float64 `json:"renewal_rate"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// อัปเดตฟิลด์หลัก (แปลงวันที่ถ้าส่งมา)
	if body.StartDate != nil {
		t, err := parseYMD(*body.StartDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_date (YYYY-MM-DD)"})
			return
		}
		ct.Start_Date = t
	}
	if body.EndDate != nil {
		t, err := parseYMD(*body.EndDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_date (YYYY-MM-DD)"})
			return
		}
		ct.End_Date = t
	}
	if body.Rate != nil {
		ct.Rate = *body.Rate
	}
	if body.StudentID != nil {
		ct.StudentID = body.StudentID
	}
	if body.RoomID != nil {
		ct.Room_ID = body.RoomID
	}
	if body.AdminID != nil {
		ct.Admin_ID = body.AdminID
	}

	// อัปเดตฟิลด์สถานะต่อสัญญา
	if body.RenewalStatus != nil {
		s := *body.RenewalStatus
		ct.RenewalStatus = &s
	}
	if body.RenewalPending != nil {
		ct.RenewalPending = *body.RenewalPending
	}
	if body.RenewalStart != nil {
		t, err := parseYMD(*body.RenewalStart)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid renewal_start_date (YYYY-MM-DD)"})
			return
		}
		ct.RenewalStartDate = &t
	}
	if body.RenewalEnd != nil {
		t, err := parseYMD(*body.RenewalEnd)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid renewal_end_date (YYYY-MM-DD)"})
			return
		}
		ct.RenewalEndDate = &t
	}
	if body.RenewalMonths != nil {
		ct.RenewalMonths = body.RenewalMonths
	}
	if body.RenewalRate != nil {
		ct.RenewalRate = body.RenewalRate
	}

	if err := db.Save(&ct).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ct)
}

// DELETE /contracts/:id
func Delete(c *gin.Context) {
	if err := config.DB().Delete(&entity.Contract{}, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
