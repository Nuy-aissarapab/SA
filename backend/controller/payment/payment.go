package payment

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/SA/config"
	"github.com/SA/entity"
	"fmt"
	"time"
	"path/filepath"
 )

// GetAll /payment
//จาก ID
func GetPayments(c *gin.Context) {
    var payments []entity.Payment
    studentId := c.Query("studentId") // รับ studentId จาก query
    db := config.DB()

    if studentId != "" {
        // ถ้าเป็น student → ดึงเฉพาะของตัวเอง
        if err := db.Preload("Student").Preload("Billing").
            Where("student_id = ?", studentId).
            Find(&payments).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
    } else {
        // ถ้าไม่มี studentId → แสดงทั้งหมด (admin)
        if err := db.Preload("Student").Preload("Billing").
            Find(&payments).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
    }

    c.JSON(http.StatusOK, payments)
}

 //จาก ID
func GetPaymentById(c *gin.Context) {
	ID := c.Param("student_id")
	var payment entity.Payment
	db := config.DB()

	if err := db.Preload("Student").Preload("Billing").First(&payment, ID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, payment)
}

func UploadEvidence(c *gin.Context) {
	// รับไฟล์
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ตั้งชื่อไฟล์ใหม่กันชนกัน
	filename := fmt.Sprintf("%d_%s", time.Now().Unix(), filepath.Base(file.Filename))

	// เก็บไฟล์ในโฟลเดอร์ uploads/
	savePath := filepath.Join("uploads", filename)
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 🔹 ตรงนี้คุณสามารถบันทึก path ลง DB ได้ เช่น:
	// evidence := entity.Evidence{ Address: savePath, Date: time.Now() }
	// config.DB().Create(&evidence)

	c.JSON(http.StatusOK, gin.H{
		"message": "อัปโหลดสำเร็จ",
		"path":    savePath,
	})
}
