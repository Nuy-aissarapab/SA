package student

import (
	"net/http"
	"strconv"

	"github.com/SA/config"
	"github.com/SA/entity"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type changePwdReq struct {
	OldPassword string `json:"old_password"`                          // นักศึกษาจะส่งมา
	NewPassword string `json:"new_password" binding:"required,min=6"` // ทุกเคสต้องส่ง
}

func ChangePassword(c *gin.Context) {
    // --- parse :id ---
    idStr := c.Param("id")
    uid64, err := strconv.ParseUint(idStr, 10, 64)
    if err != nil || uid64 == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
        return
    }
    targetID := uint(uid64)

    // --- read role & authed id (ยอมรับทั้ง "userID" และ "id") ---
    role := ""
    if v, ok := c.Get("role"); ok {
        if s, ok2 := v.(string); ok2 {
            role = s
        }
    }
    var authedID uint
    if v, ok := c.Get("userID"); ok {
        if idu, ok2 := v.(uint); ok2 {
            authedID = idu
        }
    }
    if authedID == 0 { // fallback
        if v, ok := c.Get("id"); ok {
            if idu, ok2 := v.(uint); ok2 {
                authedID = idu
            }
        }
    }
    if role == "" || authedID == 0 {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized (missing role/id from context)"})
        return
    }

    // --- bind body ---
    var body changePwdReq
    if err := c.ShouldBindJSON(&body); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // --- load student ---
    db := config.DB()
    var stu entity.Student
    if err := db.First(&stu, targetID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
        return
    }

    // --- authz ---
    switch role {
    case "student":
        if targetID != authedID {
            c.JSON(http.StatusForbidden, gin.H{"error": "forbidden (not your account)"})
            return
        }
        if body.OldPassword == "" {
            c.JSON(http.StatusBadRequest, gin.H{"error": "old_password required"})
            return
        }
        if err := bcrypt.CompareHashAndPassword([]byte(stu.Password), []byte(body.OldPassword)); err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "old password incorrect"})
            return
        }
    case "admin":
        // admin ไม่ต้องใช้ old_password
    default:
        c.JSON(http.StatusForbidden, gin.H{"error": "role not allowed"})
        return
    }

    // --- hash & update ---
    hashed, err := config.HashPassword(body.NewPassword)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    if tx := db.Model(&entity.Student{}).Where("id = ?", targetID).Update("password", hashed); tx.Error != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": tx.Error.Error()})
        return
    } else if tx.RowsAffected == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "update failed"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "password updated"})
}


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
