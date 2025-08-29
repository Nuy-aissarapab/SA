package reviewTopic

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/SA/config"
	"github.com/SA/entity"
)

// GET /reviewtopics
func GetReviewTopics(c *gin.Context) {
	var topics []entity.ReviewTopic
	if err := config.DB().Find(&topics).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, topics)
}
