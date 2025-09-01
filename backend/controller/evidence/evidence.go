package evidence

import (
	"encoding/base64"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
	"strconv"
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

    // แยก data URL
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

    // เดา ext จาก mime
    ext := ".png"
    if strings.Contains(parts[0], "jpeg") {
        ext = ".jpg"
    } else if strings.Contains(parts[0], "pdf") {
        ext = ".pdf"
    }

    // เซฟไฟล์
    newFileName := fmt.Sprintf("evidence_%d%s", time.Now().UnixNano(), ext)
    savePath := filepath.Join("uploads", newFileName)
    if err := os.MkdirAll("uploads", os.ModePerm); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างโฟลเดอร์ไม่สำเร็จ"})
        return
    }
    if err := os.WriteFile(savePath, data, 0644); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกไฟล์ไม่สำเร็จ"})
        return
    }

    // parse date
    date, err := time.Parse("2006-01-02 15:04:05", req.Date)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบวันที่ไม่ถูกต้อง"})
        return
    }

    // save DB
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

	// ก่อนส่งกลับ
	baseURL := "http://localhost:8000"

	// แปลง \ -> / ให้เป็น URL-friendly
	webPath := strings.ReplaceAll(savePath, "\\", "/")

	fileURL := fmt.Sprintf("%s/%s", baseURL, webPath) // http://localhost:8000/uploads/....
	dataURL := req.File

	c.JSON(http.StatusOK, gin.H{
	"message":  "อัปโหลดสำเร็จ",
	"evidence": evidence,
	"file_url": fileURL,  // ✅ เปิดได้จริง
	"data_url": dataURL,  // ✅ data:<mime>;base64,...
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
		// DataURL string `json:"data_url"` // ถ้าจะส่ง base64 ด้วย ค่อยเปิดบรรทัดนี้
	}

	results := make([]out, 0, len(ids))
	baseURL := "http://localhost:8000"

	for _, sid := range ids {
		var ev entity.Evidence
		if err := config.DB().
			Where("student_id = ?", sid).
			Order("date DESC, id DESC").
			First(&ev).Error; err != nil {
			continue
		}

		fileURL := fmt.Sprintf("%s/%s", baseURL, ev.File)

		mime := "image/png"
		switch strings.ToLower(filepath.Ext(ev.File)) {
		case ".jpg", ".jpeg":
			mime = "image/jpeg"
		case ".png":
			mime = "image/png"
		case ".pdf":
			mime = "application/pdf"
		}

		results = append(results, out{
			StudentID: sid,
			FileURL:   fileURL,
			Mime:      mime,
		})
	}

	c.JSON(http.StatusOK, gin.H{"items": results})
}

// GET /evidences
func ListEvidences(c *gin.Context) {
    var evidences []entity.Evidence

    // optional filter studentId
    studentId := c.Query("studentId")
    db := config.DB()
    if studentId != "" {
        db = db.Where("student_id = ?", studentId)
    }

    if err := db.Order("date DESC").Find(&evidences).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "โหลดข้อมูลไม่สำเร็จ"})
        return
    }

    baseURL := "http://localhost:8000"

    // map ออกมาเป็น JSON พร้อม file_url
    var out []gin.H
    for _, ev := range evidences {
        webPath := strings.ReplaceAll(ev.File, "\\", "/")
        fileURL := fmt.Sprintf("%s/%s", baseURL, webPath)

        out = append(out, gin.H{
            "ID":          ev.ID,
            "address":     "/" + webPath, // frontend จะต่อ API เอง
            "file_url":    fileURL,
            "mime_type":   mimeFromExt(filepath.Ext(ev.File)),
            "note":        ev.Note,
            "date":        ev.Date.Format("2006-01-02 15:04:05"),
            "student_id":  ev.StudentID,
            "payment_id":  ev.PaymentID,
            "file_name":   filepath.Base(ev.File),
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
