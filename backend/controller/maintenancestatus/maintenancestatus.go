package maintenancestatus

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/SA/config"
	"github.com/SA/entity"
)

func List(c *gin.Context) {
	var items []entity.MaintenanceStatus
	if err := config.DB().Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}
