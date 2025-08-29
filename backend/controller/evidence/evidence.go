package evidence

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

// struct รับ JSON จาก frontend
type EvidenceRequest struct {
	File      string `json:"file"`
	Note      string `json:"note"`
	Date      string `json:"date"`
	StudentID uint   `json:"student_id"`
	PaymentID uint   `json:"payment_id"`
}

func UploadEvidence(c *gin.Context) {
	var req EvidenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	// ✅ decode base64 (data:image/png;base64,xxxxx)
	parts := strings.Split(req.File, ",")
	if len(parts) != 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบ base64 ไม่ถูกต้อง"})
		return
	}

	data, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "decode base64 ล้มเหลว"})
		return
	}

	// ✅ หานามสกุลจาก mime type
	ext := ".png"
	if strings.Contains(parts[0], "jpeg") {
		ext = ".jpg"
	} else if strings.Contains(parts[0], "pdf") {
		ext = ".pdf"
	}

	// ✅ ตั้งชื่อไฟล์
	newFileName := fmt.Sprintf("evidence_%d%s", time.Now().UnixNano(), ext)
	savePath := filepath.Join("uploads", newFileName)

	// สร้างโฟลเดอร์ถ้าไม่มี
	if err := os.MkdirAll("uploads", os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างโฟลเดอร์ไม่สำเร็จ"})
		return
	}

	if err := os.WriteFile(savePath, data, 0644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกไฟล์ไม่สำเร็จ"})
		return
	}

	// ✅ parse date
	date, err := time.Parse("2006-01-02 15:04:05", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบวันที่ไม่ถูกต้อง"})
		return
	}

	// ✅ save DB
	evidence := entity.Evidence{
		File:      savePath,
		Note:      req.Note,
		Date:      date,
		PaymentID: req.PaymentID,
		StudentID: req.StudentID,
	}

	if err := config.DB().Create(&evidence).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกข้อมูลลง DB"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "อัปโหลดสำเร็จ",
		"evidence": evidence,
	})
}
