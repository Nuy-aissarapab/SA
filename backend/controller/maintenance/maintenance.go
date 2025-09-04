package maintenance

import (
	"encoding/base64"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/SA/config"
	"github.com/SA/entity"
	"github.com/gin-gonic/gin"
)

// func getAuth(c *gin.Context) (userID uint, role string, ok bool) {
// 	idVal, _ := c.Get("userID")
// 	roleVal, _ := c.Get("role")
// 	id, _ := idVal.(uint)
// 	r, _ := roleVal.(string)
// 	r = strings.ToLower(strings.TrimSpace(r))
// 	return id, r, id != 0 && r != ""
// }

func ensureUploadDir() (string, error) {
	dir := "./uploads/maintenance"
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	return dir, nil
}

// GET /maintenances?studentId=&statusId=&myOnly=
func List(c *gin.Context) {
	db := config.DB()
	var ms []entity.Maintenance

	studentID := c.Query("studentId")
	statusID := c.Query("statusId")
	myOnly := c.Query("myOnly")

	userID, role, _ := getAuth(c)

	// ✅ ไม่มี Room.Student แล้ว
	q := db.
		Preload("Student").
		Preload("Student.Room"). // ห้องปัจจุบันของ student (ถ้าจะใช้แสดง)
		Preload("Room").         // snapshot ห้องใน Maintenance
		Preload("ProblemType").
		Preload("MaintenanceStatus")

	if studentID != "" {
		q = q.Where("student_id = ?", studentID)
	}
	if statusID != "" {
		q = q.Where("maintenance_status_id = ?", statusID)
	}
	// student ดูรายการตัวเองเท่านั้น (ถ้าระบุ myOnly=1)
	if role == "student" && myOnly == "1" {
		q = q.Where("student_id = ?", userID)
	}

	if err := q.Order("id desc").Find(&ms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ms)
}

// POST /maintenances (JSON + optional base64)
func Create(c *gin.Context) {
	userID, role, ok := getAuth(c)
	if !ok || role != "student" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only student can create maintenance"})
		return
	}

	type payload struct {
		Title         string `json:"title" binding:"required"`
		Detail        string `json:"detail"`
		ProblemTypeID uint   `json:"problem_type_id" binding:"required"`
		ImageBase64   string `json:"image_base64"` // optional
		ImageName     string `json:"image_name"`   // optional
	}
	var in payload
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ✅ ดึงห้องจาก Student.Room_ID
	var stu entity.Student
	if err := config.DB().Preload("Room").First(&stu, userID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "student not found"})
		return
	}
	if stu.Room_ID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "student has no current room"})
		return
	}

	// validate problem type
	var pt entity.ProblemType
	if err := config.DB().First(&pt, in.ProblemTypeID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid problem_type_id"})
		return
	}

	m := entity.Maintenance{
		Title:         strings.TrimSpace(in.Title),
		Detail:        strings.TrimSpace(in.Detail),
		ReportDate:    time.Now(),
		StudentID:     &userID,
		ProblemTypeID: &pt.ID,
		RoomID:        stu.Room_ID, // ✅ snapshot ห้อง
	}

	// ค่า default status = "แจ้งซ่อม"
	var st entity.MaintenanceStatus
	if err := config.DB().Where("status_name = ?", "แจ้งซ่อม").First(&st).Error; err == nil {
		m.MaintenanceStatusID = &st.ID
	}

	// ถ้ามีรูป base64 → เซฟเป็นไฟล์ใน /uploads/maintenance
	if b64 := strings.TrimSpace(in.ImageBase64); b64 != "" {
		if i := strings.Index(b64, ";base64,"); i != -1 {
			b64 = b64[i+8:]
		}
		data, err := base64.StdEncoding.DecodeString(b64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid image_base64"})
			return
		}
		dir, derr := ensureUploadDir()
		if derr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": derr.Error()})
			return
		}
		name := in.ImageName
		if name == "" {
			name = "image"
		}
		filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), filepath.Base(name))
		save := filepath.Join(dir, filename)
		if err := os.WriteFile(save, data, 0o644); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		url := "/uploads/maintenance/" + filename
		m.ImageURL = &url
		m.ImageName = &filename
	}

	if err := config.DB().Create(&m).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, m)
}

// GET /maintenance/:id
func Get(c *gin.Context) {
	var m entity.Maintenance
	if err := config.DB().
		Preload("Student").
		Preload("Student.Room").
		Preload("Room"). // ✅ snapshot
		Preload("ProblemType").
		Preload("MaintenanceStatus").
		First(&m, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "maintenance not found"})
		return
	}
	c.JSON(http.StatusOK, m)
}

// PUT /maintenance/:id (owner-only; ยังแก้ได้ถ้าสถานะยัง "แจ้งซ่อม")
func Update(c *gin.Context) {
	userID, role, _ := getAuth(c)

	var m entity.Maintenance
	if err := config.DB().First(&m, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "maintenance not found"})
		return
	}

	// admin ข้ามได้; student ต้องเป็นเจ้าของ และยังอยู่ในสถานะ "แจ้งซ่อม"
	if role != "admin" {
		if m.StudentID == nil || *m.StudentID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "not your maintenance"})
			return
		}
		var st entity.MaintenanceStatus
		if m.MaintenanceStatusID != nil {
			config.DB().First(&st, *m.MaintenanceStatusID)
		}
		if st.StatusName != "แจ้งซ่อม" {
			c.JSON(http.StatusForbidden, gin.H{"error": "cannot edit after staff updated status"})
			return
		}
	}

	type payload struct {
		Title         *string `json:"title"`
		Detail        *string `json:"detail"`
		ProblemTypeID *uint   `json:"problem_type_id"`
		ImageBase64   *string `json:"image_base64"`
		ImageName     *string `json:"image_name"`
	}
	var in payload
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if in.Title != nil {
		m.Title = strings.TrimSpace(*in.Title)
	}
	if in.Detail != nil {
		m.Detail = strings.TrimSpace(*in.Detail)
	}
	if in.ProblemTypeID != nil {
		m.ProblemTypeID = in.ProblemTypeID
	}

	// อัปเดตรูป (ถ้ามี)
	if in.ImageBase64 != nil && strings.TrimSpace(*in.ImageBase64) != "" {
		b64 := strings.TrimSpace(*in.ImageBase64)
		if i := strings.Index(b64, ";base64,"); i != -1 {
			b64 = b64[i+8:]
		}
		data, err := base64.StdEncoding.DecodeString(b64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid image_base64"})
			return
		}
		dir, derr := ensureUploadDir()
		if derr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": derr.Error()})
			return
		}
		name := "image"
		if in.ImageName != nil && *in.ImageName != "" {
			name = *in.ImageName
		}
		filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), filepath.Base(name))
		save := filepath.Join(dir, filename)
		if err := os.WriteFile(save, data, 0o644); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		url := "/uploads/maintenance/" + filename
		m.ImageURL = &url
		m.ImageName = &filename
	}

	if err := config.DB().Save(&m).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}
	c.JSON(http.StatusOK, m)
}

// PATCH /maintenance/:id/status (admin only)
func UpdateStatus(c *gin.Context) {
	_, role, ok := getAuth(c)
	if !ok || strings.ToLower(strings.TrimSpace(role)) != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only admin can update status"})
		return
	}

	var in struct {
		MaintenanceStatusID *uint `json:"maintenance_status_id" form:"maintenance_status_id"`
		StatusID            *uint `json:"status_id"            form:"status_id"`
	}
	if err := c.ShouldBind(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var statusID uint
	switch {
	case in.MaintenanceStatusID != nil && *in.MaintenanceStatusID != 0:
		statusID = *in.MaintenanceStatusID
	case in.StatusID != nil && *in.StatusID != 0:
		statusID = *in.StatusID
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "maintenance_status_id is required"})
		return
	}

	var m entity.Maintenance
	if err := config.DB().First(&m, c.Param("id")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "maintenance not found"})
		return
	}

	var st entity.MaintenanceStatus
	if err := config.DB().First(&st, statusID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid maintenance_status_id"})
		return
	}

	m.MaintenanceStatusID = &st.ID
	if err := config.DB().Save(&m).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot update status"})
		return
	}
	c.JSON(http.StatusOK, m)
}

// DELETE /maintenance/:id
// DELETE /maintenance/:id
func Delete(c *gin.Context) {
	userID, role, _ := getAuth(c) // role ถูก lower-case อยู่แล้วใน getAuth ของคุณ
	id := c.Param("id")

	var m entity.Maintenance
	if err := config.DB().First(&m, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "maintenance not found"})
		return
	}

	// admin ลบได้หมด
	if role == "admin" {
		tx := config.DB().Delete(&m)
		if tx.Error != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": tx.Error.Error()})
			return
		}
		if tx.RowsAffected == 0 {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed (no rows affected)"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "maintenance deleted"})
		return
	}

	// student ต้องเป็นเจ้าของ และยัง 'แจ้งซ่อม'
	if m.StudentID == nil || *m.StudentID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your maintenance"})
		return
	}

	var st entity.MaintenanceStatus
	if m.MaintenanceStatusID != nil {
		_ = config.DB().First(&st, *m.MaintenanceStatusID).Error
	}
	// ป้องกันค่าขาว/space
	name := strings.TrimSpace(st.StatusName)
	if name != "" && name != "แจ้งซ่อม" {
		c.JSON(http.StatusForbidden, gin.H{"error": "cannot delete after staff updated status"})
		return
	}

	tx := config.DB().Delete(&m)
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": tx.Error.Error()})
		return
	}
	if tx.RowsAffected == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "delete failed (no rows affected)"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "maintenance deleted"})
}

