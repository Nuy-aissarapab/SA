package review

import (
	"fmt"
	"net/http"
	"time"

	"github.com/SA/config"
	"github.com/SA/entity"
	"github.com/gin-gonic/gin"
)

// GET /reviews?studentId=&topicId=
func List(c *gin.Context) {
	db := config.DB()
	var reviews []entity.Review

	studentID := c.Query("studentId")
	topicID := c.Query("topicId")

	q := db.Preload("Student").Preload("Contract").Preload("ReviewTopic")
	if studentID != "" {
		q = q.Where("student_id = ?", studentID)
	}
	if topicID != "" {
		q = q.Where("review_topic_id = ?", topicID)
	}

	if err := q.Find(&reviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, reviews)
}

// POST /review
func Create(c *gin.Context) {
	userID, role, ok := getAuth(c) // เหมือน Contract
	if !ok || role != "student" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only student can create review"})
		return
	}

	var in entity.Review
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	in.StudentID = &userID // สำคัญ: bind owner จาก token
	in.ReviewDate = time.Now()

	//``getreview where userid``
	var userReviewCount int64
	config.DB().Where("student_id = ?", userID).Find(&[]entity.Review{}).Count(&userReviewCount)
	fmt.Println("User Review Count:", userReviewCount)
	if userReviewCount >= 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "you have already created a review"})
		return
	}

	if err := config.DB().Create(&in).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, in)
}


// GET /review/:id
func GetByID(c *gin.Context) {
	id := c.Param("id")
	var review entity.Review
	if err := config.DB().
		Preload("Student").
		Preload("Contract").
		Preload("ReviewTopic").
		First(&review, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
		return
	}
	c.JSON(http.StatusOK, review)
}

// PUT /review/:id
func Update(c *gin.Context) {
	userID, role, ok := getAuth(c)
	if !ok || role != "student" {
		c.JSON(http.StatusForbidden, gin.H{"error": "only owner student can update"})
		return
	}

	id := c.Param("id")
	var review entity.Review
	if err := config.DB().First(&review, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
		return
	}

	// Owner check (เหมือนแนวทาง Contract เวลาแก้ของตัวเอง)
	if review.StudentID == nil || *review.StudentID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your review"})
		return
	}

	type payload struct {
		Title         *string `json:"title"`
		Comment       *string `json:"comment"`
		Rating        *int    `json:"rating"`
		ReviewTopicID *uint   `json:"review_topic_id"`
	}
	var in payload
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if in.Title != nil {
		review.Title = *in.Title
	}
	if in.Comment != nil {
		review.Comment = *in.Comment
	}
	if in.Rating != nil {
		review.Rating = *in.Rating
	}
	if in.ReviewTopicID != nil {
		review.ReviewTopicID = in.ReviewTopicID
	}

	if err := config.DB().Save(&review).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update failed"})
		return
	}
	c.JSON(http.StatusOK, review)
}

// DELETE /review/:id
func Delete(c *gin.Context) {
	userID, role, ok := getAuth(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	id := c.Param("id")
	var review entity.Review
	if err := config.DB().First(&review, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
		return
	}

	// admin ลบได้หมด
	if role == "admin" {
		if err := config.DB().Delete(&review).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "review deleted"})
		return
	}

	// student ต้องเป็นเจ้าของ
	if role == "student" && review.StudentID != nil && *review.StudentID == userID {
		if err := config.DB().Delete(&review).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "review deleted"})
		return
	}

	c.JSON(http.StatusForbidden, gin.H{"error": "not your review"})
}
