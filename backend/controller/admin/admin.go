package admin

import (
   "net/http"
   "github.com/gin-gonic/gin"
   "github.com/SA/config"
   "github.com/SA/entity"
)

func GetAll(c *gin.Context) {
   var admins []entity.Admin
   db := config.DB()

   // ใช้ Preload สำหรับ relationships ที่ต้องการ
   results := db.Preload("Room").Preload("Contract").Find(&admins)
   if results.Error != nil {
       c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
       return
   }
   c.JSON(http.StatusOK, admins)
}

// GET /members
func Get(c *gin.Context) {
   ID := c.Param("id")
   var admin entity.Admin
   
   db := config.DB()
   
   results := db.Preload("Room").Preload("Contract").First(&admin, ID)

   if results.Error != nil {
       c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
       return
   }

   if admin.ID == 0 {
       c.JSON(http.StatusNoContent, gin.H{})
       return
   }
   c.JSON(http.StatusOK, admin)
}
// DELETE / id
func Delete(c *gin.Context) {
   id := c.Param("id")
   
   db := config.DB()

   if tx := db.Exec("DELETE FROM admins WHERE id = ?", id); tx.RowsAffected == 0 {
       c.JSON(http.StatusBadRequest, gin.H{"error": "id not found"})
       return
   }
   c.JSON(http.StatusOK, gin.H{"message": "Deleted successful"})
}

