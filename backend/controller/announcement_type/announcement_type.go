package announcementtype

import (
    "net/http"
    "strconv"

    "github.com/gin-gonic/gin"
    "github.com/SA/config"
    "github.com/SA/entity"
)

type createAnnouncementTypeReq struct {
    Name string `json:"name" binding:"required"`
}

func CreateAnnouncementType(c *gin.Context) {
    var req createAnnouncementTypeReq
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    at := entity.AnnouncementType{Name: req.Name}
    if err := config.DB().Create(&at).Error; err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusCreated, gin.H{"data": at})
}

func ListAnnouncementTypes(c *gin.Context) {
    var ats []entity.AnnouncementType
    if err := config.DB().Find(&ats).Error; err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"data": ats})
}

func GetAnnouncementType(c *gin.Context) {
    idStr := c.Param("id")
    id, err := strconv.ParseUint(idStr, 10, 64)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
        return
    }

    var at entity.AnnouncementType
    if err := config.DB().First(&at, id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "announcement type not found"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"data": at})
}
