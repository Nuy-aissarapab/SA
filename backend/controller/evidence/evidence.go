package evidence

import (
	"encoding/base64"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/SA/config"
	"github.com/SA/entity"
	"github.com/gin-gonic/gin"
)

type EvidenceRequest struct {
	File      string  `json:"file" binding:"required"` // data:<mime>;base64,<...>
	Note      string  `json:"note"`
	Date      string  `json:"date" binding:"required"` // "2006-01-02 15:04:05"
	StudentID uint    `json:"student_id" binding:"required"`
	PaymentID uint    `json:"payment_id" binding:"required"`
	Method    string  `json:"method"`     // "bank" | "qr" | "cash" (optional)
	PayerName string  `json:"payer_name"` // optional
	Amount    float64 `json:"amount"`     // optional
}

func UploadEvidence(c *gin.Context) {
	var req EvidenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	// ---- decode data URL ----
	parts := strings.SplitN(req.File, ",", 2)
	if len(parts) != 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบ base64 ไม่ถูกต้อง"})
		return
	}
	header := parts[0]
	b64 := strings.TrimSpace(parts[1])

	data, err := base64.StdEncoding.DecodeString(b64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "decode base64 ล้มเหลว"})
		return
	}

	// ---- detect extension ----
	ext := ".png"
	if strings.Contains(header, "jpeg") {
		ext = ".jpg"
	} else if strings.Contains(header, "png") {
		ext = ".png"
	} else if strings.Contains(header, "pdf") {
		ext = ".pdf"
	}

	// ---- save file ----
	dir := filepath.Join("uploads", "EvidentPayment")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างโฟลเดอร์ไม่สำเร็จ"})
		return
	}
	filename := fmt.Sprintf("evidence_%d%s", time.Now().UnixNano(), ext)
	savePath := filepath.Join(dir, filename)
	if err := os.WriteFile(savePath, data, 0o644); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกไฟล์ไม่สำเร็จ"})
		return
	}

	// ---- parse date ----
	date, err := time.Parse("2006-01-02 15:04:05", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบวันที่ไม่ถูกต้อง"})
		return
	}

	// ---- create Evidence ----
	ev := entity.Evidence{
		File:      savePath,
		Note:      req.Note,
		Date:      date,
		PaymentID: req.PaymentID,
		StudentID: req.StudentID,
	}
	if err := config.DB().Create(&ev).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกข้อมูลลง DB"})
		return
	}

	// ---- optional: update Payment ----
	db := config.DB()
	var pay entity.Payment
	if err := db.First(&pay, req.PaymentID).Error; err == nil {
		if m := strings.ToLower(strings.TrimSpace(req.Method)); m == "bank" || m == "qr" || m == "cash" {
			pay.Method = m
		}
		if s := strings.TrimSpace(req.PayerName); s != "" {
			pay.PayerName = s
		}
		if req.Amount > 0 {
			pay.Amount = req.Amount
		}
		if pay.Payment_Date.IsZero() {
			pay.Payment_Date = date
		}
		_ = db.Save(&pay).Error
	}

	// ---- build file_url from request host (no hard-coded localhost) ----
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	host := c.Request.Host
	webPath := strings.ReplaceAll(savePath, "\\", "/")
	fileURL := fmt.Sprintf("%s://%s/%s", scheme, host, webPath)

	c.JSON(http.StatusOK, gin.H{
		"message":  "อัปโหลดสำเร็จ",
		"evidence": ev,
		"file_url": fileURL,
	})
}

// GET /evidences/latest-by-students?student_ids=1,2,3
func GetLatestByStudents(c *gin.Context) {
	idsParam := c.Query("student_ids")
	if idsParam == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ต้องส่ง student_ids"})
		return
	}

	parts := strings.Split(idsParam, ",")
	var ids []uint
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		if v, err := strconv.ParseUint(p, 10, 64); err == nil {
			ids = append(ids, uint(v))
		}
	}
	if len(ids) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "student_ids ไม่ถูกต้อง"})
		return
	}

	type out struct {
		StudentID uint   `json:"student_id"`
		FileURL   string `json:"file_url"`
		Mime      string `json:"mime"`
	}

	results := make([]out, 0, len(ids))

	// base URL จากคำขอจริง
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	host := c.Request.Host
	baseURL := fmt.Sprintf("%s://%s", scheme, host)

	for _, sid := range ids {
		var ev entity.Evidence
		if err := config.DB().
			Where("student_id = ?", sid).
			Order("date DESC, id DESC").
			First(&ev).Error; err != nil {
			continue
		}

		webPath := strings.ReplaceAll(ev.File, "\\", "/")
		fileURL := fmt.Sprintf("%s/%s", baseURL, webPath)

		mime := mimeFromExt(filepath.Ext(ev.File))

		results = append(results, out{
			StudentID: sid,
			FileURL:   fileURL,
			Mime:      mime,
		})
	}

	c.JSON(http.StatusOK, gin.H{"items": results})
}

// GET /evidences  (optional studentId filter)
func ListEvidences(c *gin.Context) {
	var evidences []entity.Evidence

	studentId := c.Query("studentId")
	db := config.DB()
	if studentId != "" {
		db = db.Where("student_id = ?", studentId)
	}

	if err := db.Order("date DESC").Find(&evidences).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "โหลดข้อมูลไม่สำเร็จ"})
		return
	}

	// base URL จากคำขอจริง
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	host := c.Request.Host
	baseURL := fmt.Sprintf("%s://%s", scheme, host)

	// map JSON พร้อม file_url
	var out []gin.H
	for _, ev := range evidences {
		webPath := strings.ReplaceAll(ev.File, "\\", "/")
		fileURL := fmt.Sprintf("%s/%s", baseURL, webPath)

		out = append(out, gin.H{
			"ID":         ev.ID,
			"address":    "/" + webPath, // ถ้า FE จะต่อเอง
			"file_url":   fileURL,
			"mime_type":  mimeFromExt(filepath.Ext(ev.File)),
			"note":       ev.Note,
			"date":       ev.Date.Format("2006-01-02 15:04:05"),
			"student_id": ev.StudentID,
			"payment_id": ev.PaymentID,
			"file_name":  filepath.Base(ev.File),
		})
	}

	c.JSON(http.StatusOK, out)
}

func mimeFromExt(ext string) string {
	switch strings.ToLower(ext) {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".pdf":
		return "application/pdf"
	}
	return "application/octet-stream"
}
