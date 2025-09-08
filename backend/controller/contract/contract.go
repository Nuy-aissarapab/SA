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
	Months    *int     `json:"months"`      
	StartDate *string  `json:"start_date"` 
	EndDate   *string  `json:"end_date"`   
	Rate      *float64 `json:"rate"`     
}

func parseYMD(s string) (time.Time, error) {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return t, err
	}

	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.Local), nil
}
func addDays(t time.Time, days int) time.Time   { return t.AddDate(0, 0, days) }
func addMonths(t time.Time, m int) time.Time    { return t.AddDate(0, m, 0) }

func roundUpToMultiple(n, base int) int {
	if n <= 0 {
		return base
	}
	return ((n + base - 1) / base) * base
}

func monthsBetween(start, end time.Time) int {
	y := end.Year() - start.Year()
	m := int(end.Month()) - int(start.Month())
	months := y*12 + m

	if end.Day() < start.Day() {
		months--
	}
	if months < 0 {
		return 0
	}
	return months
}

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

	var start time.Time
	if body.StartDate != nil && *body.StartDate != "" {
		t, err := parseYMD(*body.StartDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_date"})
			return
		}
		start = t
	} else {
		start = addDays(ct.End_Date, 1)
	}

	const block = 3
	var m int

	if body.EndDate != nil && *body.EndDate != "" {

		tEnd, err := parseYMD(*body.EndDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_date"})
			return
		}
		rawMonths := monthsBetween(start, tEnd)
		m = roundUpToMultiple(rawMonths, block)
		if m == 0 {
			m = block
		}
	} else {

		if body.Months != nil && *body.Months > 0 {
			m = roundUpToMultiple(*body.Months, block)
		} else {
			m = block
		}
	}

	end := addMonths(start, m)


	status := "pending"
	ct.RenewalPending = true
	ct.RenewalMonths = &m                 
	ct.RenewalStartDate = &start
	ct.RenewalEndDate = &end
	ct.RenewalRate = body.Rate
	ct.RenewalStatus = &status

	if err := db.Save(&ct).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ct)
}

func ListContracts(c *gin.Context) {
	var contracts []entity.Contract
	db := config.DB()

	q := db.
		// Preload("Billings").
		Preload("Room").
		Preload("Admin").
		Preload("Student").
		Order("start_date ASC")

	if sid := c.Query("studentId"); sid != "" {
		q = q.Where("student_id = ?", sid)
	}

	if err := q.Preload("Payment").Find(&contracts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, contracts)
}

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
        RoomID: payload.RoomID, Admin_ID: payload.AdminID,
    }
    if err := db.Create(&ct).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusCreated, ct)
}

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

	var body struct {
		StartDate      *string  `json:"start_date"`
		EndDate        *string  `json:"end_date"`
		Rate           *float64 `json:"rate"`
		StudentID      *uint    `json:"StudentID"`
		RoomID         *uint    `json:"Room_ID"`
		AdminID        *uint    `json:"Admin_ID"`

		RenewalStatus  *string  `json:"renewal_status"` 
		RenewalPending *bool    `json:"renewal_pending"`
		RenewalStart   *string  `json:"renewal_start_date"`  
		RenewalEnd     *string  `json:"renewal_end_date"`    
		RenewalMonths  *int     `json:"renewal_months"`
		RenewalRate    *float64 `json:"renewal_rate"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

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
		ct.RoomID = body.RoomID
	}
	if body.AdminID != nil {
		ct.Admin_ID = body.AdminID
	}

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

func Delete(c *gin.Context) {
	if err := config.DB().Delete(&entity.Contract{}, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
