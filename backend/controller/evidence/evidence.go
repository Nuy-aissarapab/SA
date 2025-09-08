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
	"mime"           
	"github.com/SA/config"
	"github.com/SA/entity"
	"github.com/gin-gonic/gin"
    "errors"         
    "gorm.io/gorm"  
)

type EvidenceRequest struct {
	File      string  `json:"file" binding:"required"`
	Note      string  `json:"note"`
	Date      string  `json:"date" binding:"required"`
	StudentID uint    `json:"student_id" binding:"required"`
	PaymentID uint    `json:"payment_id" binding:"required"`
	Method    string  `json:"method"`   
	PayerName string  `json:"payer_name"` 
	Amount    float64 `json:"amount"`    
}

func UploadEvidence(c *gin.Context) {
	var req EvidenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

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

	ext := ".png"
	if strings.Contains(header, "jpeg") || strings.Contains(header, "jpg") {
		ext = ".jpg"
	} else if strings.Contains(header, "png") {
		ext = ".png"
	} else if strings.Contains(header, "pdf") {
		ext = ".pdf"
	}

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

	// ถ้าอยาก fix timezone ให้ใช้ ParseInLocation กับ Asia/Bangkok
	date, err := time.Parse("2006-01-02 15:04:05", req.Date)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบวันที่ไม่ถูกต้อง"})
		return
	}

	db := config.DB()

	// ===== UPSERT: ถ้ามี evidence ของ payment นี้แล้ว → อัปเดตแทน =====
	var existed entity.Evidence
	tx := db.Where("payment_id = ?", req.PaymentID).
		Order("date DESC, id DESC").
		First(&existed)

	var ev entity.Evidence
	if tx.Error == nil {
		// อัปเดตแถวเดิม
		oldPath := existed.File
		existed.File = savePath
		existed.Note = req.Note
		existed.Date = date
		existed.StudentID = req.StudentID
		// existed.PaymentID = req.PaymentID // เดิมอยู่แล้ว

		if err := db.Save(&existed).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดต Evidence ไม่สำเร็จ"})
			return
		}
		// ลบไฟล์เก่าถ้าเปลี่ยน path
		if oldPath != "" && oldPath != savePath {
			_ = os.Remove(oldPath)
		}
		ev = existed
	} else if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
		// ยังไม่มี → สร้างใหม่
		ev = entity.Evidence{
			File:      savePath,
			Note:      req.Note,
			Date:      date,
			PaymentID: req.PaymentID,
			StudentID: req.StudentID,
		}
		if err := db.Create(&ev).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกข้อมูลลง DB"})
			return
		}
	} else {
		// error อื่น
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถตรวจสอบข้อมูลเดิม"})
		return
	}

	// อัปเดต meta ฝั่ง Payment (optional)
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

	// สร้าง URL สำหรับเข้าถึงไฟล์
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	host := c.Request.Host
	webPath := strings.ReplaceAll(ev.File, "\\", "/")
	fileURL := fmt.Sprintf("%s://%s/%s", scheme, host, webPath)

	c.JSON(http.StatusOK, gin.H{
		"message":  "บันทึกสำเร็จ",
		"evidence": ev,
		"file_url": fileURL,
	})
}


func GetLatestByStudent(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" { idStr = c.Query("student_id") }
	u64, err := strconv.ParseUint(strings.TrimSpace(idStr), 10, 64)
	if err != nil || u64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "student_id ไม่ถูกต้อง"})
		return
	}
	sid := uint(u64)

	type evidenceOut struct {
		Address   string `json:"address,omitempty"`
		Url       string `json:"url,omitempty"`
		FileName  string `json:"file_name,omitempty"`
		Date      string `json:"date,omitempty"`
		Note      string `json:"note,omitempty"`
		Mime      string `json:"mime,omitempty"`
	}
	type out struct {
		StudentID uint         `json:"student_id"`
		Evidence  *evidenceOut `json:"evidence,omitempty"`
	}

	proto := c.GetHeader("X-Forwarded-Proto")
	if proto == "" {
		if c.Request.TLS != nil { proto = "https" } else { proto = "http" }
	}
	host := c.GetHeader("X-Forwarded-Host")
	if host == "" { host = c.Request.Host }
	baseURL := strings.TrimRight(fmt.Sprintf("%s://%s", proto, host), "/")

	absURL := func(p string) string {
		p = strings.TrimSpace(strings.ReplaceAll(p, "\\", "/"))
		if p == "" { return "" }
		if strings.HasPrefix(p, "http://") || strings.HasPrefix(p, "https://") { return p }
		return baseURL + "/" + strings.TrimLeft(p, "/")
	}
	mimeFromExt := func(ext string) string {
		ext = strings.ToLower(strings.TrimSpace(ext))
		if ext == "" { return "application/octet-stream" }
		if t := mime.TypeByExtension(ext); t != "" { return t }
		switch ext {
		case ".jpg", ".jpeg": return "image/jpeg"
		case ".png": return "image/png"
		case ".gif": return "image/gif"
		case ".webp": return "image/webp"
		case ".pdf": return "application/pdf"
		default: return "application/octet-stream"
		}
	}

	var ev entity.Evidence
	if err := config.DB().
		Where("student_id = ?", sid).
		Order("date DESC, id DESC").
		First(&ev).Error; err != nil {

		c.JSON(http.StatusOK, out{ StudentID: sid, Evidence: nil })
		return
	}

	webPath := strings.ReplaceAll(ev.File, "\\", "/")
	full := absURL(webPath)
	fn := filepath.Base(webPath)
	m := mimeFromExt(filepath.Ext(webPath))

	dateStr := ""
	if !ev.Date.IsZero() {
		dateStr = ev.Date.Format("2006-01-02 15:04:05")
	}

	c.JSON(http.StatusOK, out{
		StudentID: sid,
		Evidence: &evidenceOut{
			Address:  webPath,
			Url:      full,
			FileName: fn,
			Date:     dateStr,
			Note:     ev.Note,
			Mime:     m,
		},
	})
}

// GET /evidences?payment_id=3  // คืนรายการเรียงใหม่→เก่า
func ListEvidences(c *gin.Context) {
    var evidences []entity.Evidence
    db := config.DB()

    if sid := c.Query("student_id"); sid != "" {
        db = db.Where("student_id = ?", sid)
    }
    if pid := c.Query("payment_id"); pid != "" {
        db = db.Where("payment_id = ?", pid)
    }

    if err := db.Order("date DESC, id DESC").Find(&evidences).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "โหลดข้อมูลไม่สำเร็จ"})
        return
    }

    loc, _ := time.LoadLocation("Asia/Bangkok")
    scheme := "http"
    if c.Request.TLS != nil { scheme = "https" }
    host := c.Request.Host

    var out []gin.H
    for _, ev := range evidences {
        web := strings.ReplaceAll(ev.File, "\\", "/")
        out = append(out, gin.H{
            "ID":         ev.ID,
            "address":    "/" + web,
            "file_url":   fmt.Sprintf("%s://%s/%s", scheme, host, web),
            "note":       ev.Note,
            "date": ev.Date.In(loc).Format("2006-01-02 15:04:05"),
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


// ====== NEW: Get by ID ======
func GetEvidenceByID(c *gin.Context) {
	idStr := strings.TrimSpace(c.Param("id"))
	u64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || u64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id ไม่ถูกต้อง"})
		return
	}

	var ev entity.Evidence
	if err := config.DB().First(&ev, uint(u64)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ Evidence"})
		return
	}

	// สร้าง URL ไฟล์
	proto := "http"
	if c.Request.TLS != nil { proto = "https" }
	host := c.Request.Host
	webPath := strings.ReplaceAll(ev.File, "\\", "/")
	fileURL := fmt.Sprintf("%s://%s/%s", proto, host, webPath)

	c.JSON(http.StatusOK, gin.H{
		"ID":         ev.ID,
		"file":       ev.File,
		"file_url":   fileURL,
		"note":       ev.Note,
		"date":       ev.Date.Format("2006-01-02 15:04:05"),
		"student_id": ev.StudentID,
		"payment_id": ev.PaymentID,
	})
}

// ====== NEW: Update (PUT) ======
type UpdateEvidenceRequest struct {
	File      string  `json:"file"` // base64: "data:...;base64,<payload>"
	Note      string  `json:"note"`
	Date      string  `json:"date"` // "2006-01-02 15:04:05"
	StudentID uint    `json:"student_id"`
	PaymentID uint    `json:"payment_id"`
	Method    string  `json:"method"`     // optional: จะอัปเดตไปที่ Payment หากใส่มา
	PayerName string  `json:"payer_name"` // optional
	Amount    float64 `json:"amount"`     // optional
}

func UpdateEvidence(c *gin.Context) {
	idStr := strings.TrimSpace(c.Param("id"))
	u64, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || u64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id ไม่ถูกต้อง"})
		return
	}

	var ev entity.Evidence
	db := config.DB()
	if err := db.First(&ev, uint(u64)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ Evidence"})
		return
	}

	var req UpdateEvidenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ถ้ามีไฟล์ใหม่ (base64) → เซฟและแทน path
	if strings.TrimSpace(req.File) != "" {
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

		ext := ".png"
		if strings.Contains(header, "jpeg") || strings.Contains(header, "jpg") {
			ext = ".jpg"
		} else if strings.Contains(header, "pdf") {
			ext = ".pdf"
		} else if strings.Contains(header, "png") {
			ext = ".png"
		}

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
		ev.File = savePath
	}

	if strings.TrimSpace(req.Note) != "" {
		ev.Note = req.Note
	}
	if strings.TrimSpace(req.Date) != "" {
		if t, err := time.Parse("2006-01-02 15:04:05", req.Date); err == nil {
			ev.Date = t
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบวันที่ไม่ถูกต้อง"})
			return
		}
	}
	if req.StudentID > 0 {
		ev.StudentID = req.StudentID
	}
	if req.PaymentID > 0 {
		ev.PaymentID = req.PaymentID
	}

	if err := db.Save(&ev).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดต Evidence ไม่สำเร็จ"})
		return
	}

	// ถ้าอยาก sync fields ไปที่ Payment ด้วย (ถ้าส่งมา)
	if req.PaymentID > 0 {
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
			if !ev.Date.IsZero() && pay.Payment_Date.IsZero() {
				pay.Payment_Date = ev.Date
			}
			_ = db.Save(&pay).Error
		}
	}

	// response
	proto := "http"
	if c.Request.TLS != nil { proto = "https" }
	host := c.Request.Host
	webPath := strings.ReplaceAll(ev.File, "\\", "/")
	fileURL := fmt.Sprintf("%s://%s/%s", proto, host, webPath)

	c.JSON(http.StatusOK, gin.H{
		"message": "อัปเดตสำเร็จ",
		"evidence": gin.H{
			"ID":         ev.ID,
			"file":       ev.File,
			"file_url":   fileURL,
			"note":       ev.Note,
			"date":       ev.Date.Format("2006-01-02 15:04:05"),
			"student_id": ev.StudentID,
			"payment_id": ev.PaymentID,
		},
	})
}
