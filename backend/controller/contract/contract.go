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

// PUT /contracts/:id/renew
func Renew(c *gin.Context) {
	db := config.DB()

	// 1) โหลดสัญญาเดิม
	var old entity.Contract
	if err := db.Preload("Room").Preload("Admin").Preload("Student").
		First(&old, c.Param("id")).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "contract not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 2) รับ body
	var body renewBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3) คำนวณ start / end / rate
	// start: ถ้าไม่ส่ง -> วันถัดจาก End_Date เดิม
	var start time.Time
	if body.StartDate != nil && *body.StartDate != "" {
		t, err := parseYMD(*body.StartDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid start_date format (YYYY-MM-DD)"})
			return
		}
		start = t
	} else {
		start = addDays(old.End_Date, 1)
	}

	// end: ถ้าส่ง end_date ใช้เลย; ไม่งั้นใช้ months (default 3)
	var end time.Time
	if body.EndDate != nil && *body.EndDate != "" {
		t, err := parseYMD(*body.EndDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid end_date format (YYYY-MM-DD)"})
			return
		}
		end = t
	} else {
		months := 3
		if body.Months != nil && *body.Months > 0 {
			months = *body.Months
		}
		// ✅ นับแบบ “วันเดียวกันของอีก X เดือนถัดไป”
		// ตัวอย่าง: start=2025-08-30, months=3 -> end=2025-11-30
		end = addMonths(start, months)
	}

	// ตรวจค่าเวลาให้ถูกต้อง
	if !start.After(old.End_Date) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "start_date must be after current contract end_date"})
		return
	}
	if !end.After(start) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end_date must be after start_date"})
		return
	}

	// ใช้ rate เดิมถ้าไม่ได้ส่งใหม่
	rate := old.Rate
	if body.Rate != nil {
		rate = *body.Rate
	}

	// (ออปชัน) กันช่วงทับซ้อนในห้องเดียวกัน
	if old.Room_ID != nil {
		var count int64
		if err := db.Model(&entity.Contract{}).
			Where("room_id = ?", *old.Room_ID).
			Where("start_date <= ? AND end_date >= ?", end, start).
			Count(&count).Error; err == nil && count > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "date range overlaps with existing contract of this room"})
			return
		}
	}

	// 4) สร้างสัญญาใหม่ (เก็บประวัติเดิมไว้)
	newContract := entity.Contract{
		Start_Date: start,
		End_Date:   end,
		Rate:       rate,
		Room_ID:    old.Room_ID,
		Admin_ID:   old.Admin_ID,
		StudentID:  old.StudentID,
	}

	if err := db.Create(&newContract).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create renewal: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, newContract)
}
