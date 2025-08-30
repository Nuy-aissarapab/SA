package announcement

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/SA/config"
	"github.com/SA/entity"
)


func CreateAnnouncement(c *gin.Context) { //ai fix after
	var announcement entity.Announcement
	if err := c.ShouldBindJSON(&announcement); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.DB().Create(&announcement).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": announcement})
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
	a.AnnouncementsTargetID = payload.AnnouncementsTargetID
	

    if err := config.DB().Save(&a).Error; err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"data": a})
}
