package announcement

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/SA/config"
	"github.com/SA/entity"
	"github.com/gin-gonic/gin"
)


func CreateAnnouncement(c *gin.Context) {
	var a entity.Announcement

	ct := c.ContentType()
	if strings.HasPrefix(ct, "multipart/") {
		// อ่านฟิลด์จาก form (ใช้ tag `form:"..."` ที่ประกาศไว้ใน entity)
		if err := c.ShouldBind(&a); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid form: " + err.Error()})
			return
		}

		// ไฟล์แนบ (ออปชัน)
		file, _ := c.FormFile("picture")
		if file != nil {
			// สร้างโฟลเดอร์ uploads ก่อน (ถ้ายังไม่มี)
			// os.MkdirAll("uploads", 0755)

			filename := fmt.Sprintf("uploads/%d_%s", time.Now().UnixNano(), filepath.Base(file.Filename))
			if err := c.SaveUploadedFile(file, filename); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "upload failed: " + err.Error()})
				return
			}
			// เก็บ path ไว้ใน DB (จะเสิร์ฟผ่าน /uploads)
			a.Picture = "/" + filename
		}
	} else {
		// รับ JSON ปกติ (เผื่อ client บางที่ส่งเป็น application/json)
		if err := c.ShouldBindJSON(&a); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json: " + err.Error()})
			return
		}
	}

	// TODO: ถ้าอยากผูก Admin จาก token ให้ดึงจาก middleware แล้วเติม a.AdminID ที่นี่

	if err := config.DB().Create(&a).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": a})
}

func ListAnnouncements(c *gin.Context) {
	var announcements []entity.Announcement
	if err := config.DB().
		Preload("Admin").
		Preload("AnnouncementsTarget").
		Preload("AnnouncementType").
		Find(&announcements).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": announcements})
}


func ListByIDAnnouncements(c *gin.Context) {
    var a entity.Announcement
    id := c.Param("id")

    if err := config.DB().
        Preload("Admin").
        Preload("AnnouncementsTarget").
        Preload("AnnouncementType").
        First(&a, id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "announcement not found"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"data": a})
}



func DeleteAnnouncement(c *gin.Context) {
	id := c.Param("id")
	if tx := config.DB().Exec("DELETE FROM announcements WHERE id = ?", id); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "announcement not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": id})
}

func UpdateAnnouncement(c *gin.Context) {
    id := c.Param("id")

    var payload entity.Announcement
    if err := c.ShouldBindJSON(&payload); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    var a entity.Announcement
    if err := config.DB().First(&a, id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "announcement not found"})
        return
    }

    a.Title = payload.Title
    a.Content = payload.Content
	a.Picture = payload.Picture
	a.AdminID = payload.AdminID
	a.AnnouncementTypeID = payload.AnnouncementTypeID
	a.AnnouncementTargetID = payload.AnnouncementTargetID
	

    if err := config.DB().Save(&a).Error; err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"data": a})
}
