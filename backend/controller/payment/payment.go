package payment

import (
	"net/http"
	"time"
	"fmt"
	"github.com/SA/config"
	"github.com/SA/entity"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"strings"
)

// controller/payment/payment.go (หรือไฟล์ที่คุณวางไว้)
func recomputeBillingStatus(db *gorm.DB, billingID uint) error {
	var b entity.Billing
	if err := db.First(&b, billingID).Error; err != nil {
		return err
	}

	var totalPaid float64
	if err := db.Model(&entity.Payment{}).
		Where("billing_id = ? AND payment_status = ?", billingID, "paid").
		Select("COALESCE(SUM(amount),0)").Scan(&totalPaid).Error; err != nil {
		return err
	}

	var next *string
	if totalPaid >= b.AmountDue && b.AmountDue > 0 {
		v := "paid";    next = &v
	} else if totalPaid > 0 {
		v := "pending"; next = &v
	} else {
		next = nil
	}

	b.Status = next // ✅ ตอนนี้ชนิดตรงกัน (*string)
	return db.Save(&b).Error
}

// ---------- queries ----------
func GetPayments(c *gin.Context) {
	var payments []entity.Payment
	studentId := c.Query("studentId")
	billingId := c.Query("billingId")
	db := config.DB()

	q := db.Preload("Student").Preload("Billing").Preload("Receiver").Order("created_at DESC")
	if studentId != "" {
		q = q.Where("student_id = ?", studentId)
	}
	if billingId != "" {
		q = q.Where("billing_id = ?", billingId)
	}
	if err := q.Find(&payments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, payments)
}




func GetPaymentById(c *gin.Context) {
	id := c.Param("id")
	var p entity.Payment
	if err := config.DB().Preload("Student").Preload("Billing").Preload("Receiver").First(&p, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}
	c.JSON(http.StatusOK, p)
}

// ---------- create ----------
// ---------- create ----------
type createPaymentBody struct {
	StudentID     uint     `json:"student_id" binding:"required"`
	BillingID     uint     `json:"billing_id" binding:"required"`
	Amount        float64  `json:"amount" binding:"required"`
	Method        string   `json:"method" binding:"required"`
	PaymentDate   *string  `json:"payment_date"`             // "2006-01-02 15:04:05"
	PayerName     string   `json:"payer_name"`
	ReceiptNumber string   `json:"receipt_number"`
	EvidenceURL   string   `json:"evidence_url"`
	Status        *string  `json:"status"`                   // null | pending | remaining | paid
	ReceiverID    *uint    `json:"receiver_id"`              // optional
}

func CreatePayment(c *gin.Context) {
	var body createPaymentBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	db := config.DB()

	// default status = pending, but allow explicit remaining/paid
	def := "pending"
	if body.Status != nil {
		s := strings.ToLower(strings.TrimSpace(*body.Status))
		if s == "pending" || s == "remaining" || s == "paid" {
			def = s
		}
	}

	p := entity.Payment{
		StudentID:      body.StudentID,
		BillingID:      body.BillingID,
		Amount:         body.Amount,
		Method:         body.Method,
		PayerName:      body.PayerName,
		EvidenceURL:    body.EvidenceURL,
		ReceiverID:     body.ReceiverID,
		Payment_Status: &def, // pending | remaining | paid
	}

	p.ReceiptNumber = receiptFromBillingID(p.BillingID)

	if body.PaymentDate != nil {
		if t, err := time.Parse("2006-01-02 15:04:05", *body.PaymentDate); err == nil {
			p.Payment_Date = t
		}
	} else {
		p.Payment_Date = time.Now()
	}

	if err := db.Create(&p).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_ = recomputeBillingStatus(db, p.BillingID)
	c.JSON(http.StatusCreated, gin.H{"message": "created", "payment": p})
}

// ---------- update status ----------
type updateStatusBody struct {
	Status *string `json:"status" binding:"required"` // null ป้องกันตรงนี้, แต่ต้อง deref ตอนใช้
}

func UpdatePaymentStatus(c *gin.Context) {
	id := c.Param("id")

	var body updateStatusBody
	if err := c.ShouldBindJSON(&body); err != nil || body.Status == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid status body"})
		return
	}

	s := strings.ToLower(strings.TrimSpace(*body.Status))
	switch s {
	case "pending", "remaining", "paid":
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "status must be 'pending', 'remaining' or 'paid'"})
		return
	}

	db := config.DB()
	var pay entity.Payment
	if err := db.First(&pay, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}

	pay.Payment_Status = &s
	if s == "paid" && pay.Payment_Date.IsZero() {
		pay.Payment_Date = time.Now()
	}

	if err := db.Save(&pay).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 🔁 keep Billing in sync
	_ = recomputeBillingStatus(db, pay.BillingID)

	c.JSON(http.StatusOK, gin.H{"message": "updated", "payment": pay})
}

// ---------- quick confirm/reject ----------
func ConfirmPayment(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var pay entity.Payment
	if err := db.First(&pay, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}
	status := "paid"
	pay.Payment_Status = &status
	if pay.Payment_Date.IsZero() {
		pay.Payment_Date = time.Now()
	}
	if err := db.Save(&pay).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	_ = recomputeBillingStatus(db, pay.BillingID)
	c.JSON(http.StatusOK, gin.H{"message": "confirmed", "payment": pay})
}

func RejectPayment(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var pay entity.Payment
	if err := db.First(&pay, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}
	status := "pending" // หรือใช้ "rejected" ถ้าต้องการสถานะนี้
	pay.Payment_Status = &status
	if err := db.Save(&pay).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	_ = recomputeBillingStatus(db, pay.BillingID)
	c.JSON(http.StatusOK, gin.H{"message": "rejected", "payment": pay})
}

// ---------- receiver ----------
type updateReceiverBody struct {
	ReceiverID *uint `json:"receiver_id"` // null เพื่อล้าง
}

func UpdatePaymentReceiver(c *gin.Context) {
	id := c.Param("id")
	var body updateReceiverBody
	if err := c.ShouldBindJSON(&body); err != nil {
	 c.JSON(http.StatusBadRequest, gin.H{"error":"invalid body"})
	 return
	}
	db := config.DB()
	var pay entity.Payment
	if err := db.First(&pay, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}
	if body.ReceiverID != nil {
		var a entity.Admin
		if err := db.First(&a, *body.ReceiverID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "receiver admin not found"})
			return
		}
		pay.ReceiverID = body.ReceiverID
	} else {
		pay.ReceiverID = nil
	}
	if err := db.Save(&pay).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "receiver updated", "payment": pay})
}

// helper
func receiptFromBillingID(id uint) string {
    // จะใช้เป็นแค่เลขดิบก็ได้: return fmt.Sprintf("%d", id)
    return fmt.Sprintf("B%06d", id) // ตัวอย่าง: B000123
}

// เพิ่มด้านบนไฟล์
type updateMethodBody struct {
	Method string `json:"method" binding:"required"` // "bank" | "qr" | "cash" | ...
}

// PATCH /payments/:id/method
func UpdatePaymentMethod(c *gin.Context) {
	id := c.Param("id")

	var body updateMethodBody
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid method body"})
		return
	}

	// อนุญาตเฉพาะค่าที่รองรับ
	allowed := map[string]bool{"bank": true, "qr": true, "cash": true}
	if !allowed[body.Method] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unsupported method"})
		return
	}

	db := config.DB()
	var pay entity.Payment
	if err := db.First(&pay, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}

	pay.Method = body.Method
	if err := db.Save(&pay).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "method updated", "payment": pay})
}
