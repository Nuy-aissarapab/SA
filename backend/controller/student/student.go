package student

import (
   "net/http"
   "github.com/gin-gonic/gin"
   "github.com/SA/config"
   "github.com/SA/entity"
)

func GetAll(c *gin.Context) {
   var students []entity.Student
   db := config.DB()

   // ใช้ Preload สำหรับ relationships ที่ต้องการ
   results := db.Preload("Room").Preload("Contract").Preload("Payments").Find(&students)
   if results.Error != nil {
       c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
       return
   }
   c.JSON(http.StatusOK, students)
}

// GET /members
func Get(c *gin.Context) {
   ID := c.Param("id")
   var student entity.Student
   
   db := config.DB()
   
   results := db.Preload("Room").Preload("Contract").Preload("Payments").First(&student, ID)

   if results.Error != nil {
       c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
       return
   }

   if student.ID == 0 {
       c.JSON(http.StatusNoContent, gin.H{})
       return
   }
   c.JSON(http.StatusOK, student)
}
// DELETE / id
func Delete(c *gin.Context) {
   id := c.Param("id")
   
   db := config.DB()

   if tx := db.Exec("DELETE FROM students WHERE id = ?", id); tx.RowsAffected == 0 {
       c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
       return
   }
   c.JSON(http.StatusOK, gin.H{"message": "Deleted successful"})
}

func UpdateUser(c *gin.Context) {
   var student entity.Student
   id := c.Param("id")
   if err := c.ShouldBindJSON(&student); err != nil {
	   c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	   return
   }
   db := config.DB()
   if tx := db.Where("id = ?", id).First(&entity.Student{}); tx.RowsAffected == 0 {
	   c.JSON(http.StatusBadRequest, gin.H{"error": "student not found"})
	   return
   }
   if err := db.Model(&student).Where("id = ?", id).Updates(student).Error; err != nil {
	   c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	   return
   }
   c.JSON(http.StatusOK, gin.H{"data": student})
}