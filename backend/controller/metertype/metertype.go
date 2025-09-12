package metertype



import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/SA/config"
	"github.com/SA/entity"
)

func GetMeterType(c *gin.Context) {
    db := config.DB()

    var metertype []entity.MeterType

    // ดึงทุกประเภทมิเตอร์
    results := db.Find(&metertype)
    if results.Error != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
        return
    }

    c.JSON(http.StatusOK, metertype)
}