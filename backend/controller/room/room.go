package room

import (
	"net/http"
	"github.com/SA/config"
	"github.com/gin-gonic/gin"
	"github.com/SA/entity"
)

func GetAll(c *gin.Context) {
	var rooms []entity.Room

	if err := config.DB().Raw("SELECT * FROM rooms").Scan(&rooms).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": rooms})

}




