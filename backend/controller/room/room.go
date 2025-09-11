package room

import (
	"net/http"
	"github.com/SA/config"
	"github.com/gin-gonic/gin"
	"github.com/SA/entity"
	"time"
)

func GetAll(c *gin.Context) {
	var rooms []entity.Room

	if err := config.DB().Raw("SELECT * FROM rooms").Scan(&rooms).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": rooms})

}

// ดึงห้องทั้งหมด
func GetAllRooms(c *gin.Context) {
	var rooms []entity.Room

	if err := config.DB().
		Preload("RoomType").
		Preload("Student").
		Preload("Admin").
		Preload("RoomAsset").
		Preload("RoomAsset.AssetType").
		Find(&rooms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, rooms)
}

// เพิ่มห้องใหม่
func PostAllRooms(c *gin.Context) {
	var room entity.Room
	if err := c.ShouldBindJSON(&room); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.DB().Create(&room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถเพิ่มห้องได้"})
		return
	}

	c.JSON(http.StatusCreated, room)
}

func UpdateAllRoom(c *gin.Context) {
    id := c.Param("id")
    var room entity.Room

    // Find existing room
    if err := config.DB().First(&room, id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบห้อง"})
        return
    }

    // Bind JSON to struct
    var req struct {
        RoomNumber  string     `json:"room_number"`
        RoomTypeID  uint       `json:"room_type_id"`
        Status      string     `json:"room_status"`
        Image       string     `json:"image"`
        StudentID   *uint      `json:"student_id"`
        AdminID     *uint      `json:"admin_id"`
        BookingTime *time.Time `json:"booking_time"`
        Price       float64    `json:"rental_price"`
    }

    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
        return
    }

    // Update room fields
    room.RoomNumber = req.RoomNumber
    room.RoomTypeID = req.RoomTypeID
    room.Status = req.Status
    room.Image = req.Image
    room.StudentID = req.StudentID

    if req.AdminID != nil {
        room.AdminID = *req.AdminID
    }

    if req.BookingTime != nil {
        room.BookingTime = *req.BookingTime
    }

    // Save updated room
    if err := config.DB().Save(&room).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดตห้องได้"})
        return
    }

    // Update rental price in RoomType
    if err := config.DB().Model(&entity.RoomType{}).
        Where("id = ?", req.RoomTypeID).
        Update("rental_price", req.Price).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดตราคาประเภทห้องได้"})
        return
    }

    // Reload with relations
    if err := config.DB().
        Preload("RoomType").
        Preload("Student").
        Preload("Admin").
        Preload("RoomAsset").
        Preload("RoomAsset.AssetType").
        First(&room, room.ID).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถโหลดข้อมูลห้องได้"})
        return
    }

    c.JSON(http.StatusOK, room)
}

// ลบห้อง
func DeleteAllRoom(c *gin.Context) {
    id := c.Param("id")
    var room entity.Room

    // ลองค้นด้วย PK (ID)
    if err := config.DB().First(&room, id).Error; err != nil {
        // ถ้าไม่เจอ ลองค้นด้วย RoomNumber
        if err := config.DB().Where("room_number = ?", id).First(&room).Error; err != nil {
            c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบห้อง"})
            return
        }
    }

    if err := config.DB().Delete(&room).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลบห้องได้"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "ลบห้องสำเร็จ"})
}


// ดึงห้องตาม ID
func GetRoomByID(c *gin.Context) {
	id := c.Param("id")
	var room entity.Room

	if err := config.DB().
		Preload("RoomType").
		Preload("Student").
		Preload("Admin").
		Preload("RoomAsset").
		Preload("RoomAsset.AssetType").
		First(&room, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลห้อง"})
		return
	}

	c.JSON(http.StatusOK, room)
}

// Student จองห้อง
func BookRoom(c *gin.Context) {
	var req struct {
		RoomID    uint `json:"room_id"`
		StudentID uint `json:"student_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	var existingRoom entity.Room
	if err := config.DB().Where("student_id = ?", req.StudentID).First(&existingRoom).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "นักศึกษาท่านนี้ได้ทำการจองห้องไปแล้ว"})
		return
	}

	var room entity.Room
	if err := config.DB().First(&room, req.RoomID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลห้อง"})
		return
	}

	if room.StudentID != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ห้องถูกจองแล้ว"})
		return
	}

	room.StudentID = &req.StudentID
	room.Status = "ไม่ว่าง"
	room.BookingTime = time.Now()

	if err := config.DB().Save(&room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "จองห้องไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "จองห้องสำเร็จ"})
}

// ยกเลิกการจอง
func CancelBooking(c *gin.Context) {
	var req struct {
		StudentID uint `json:"student_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	var room entity.Room
	if err := config.DB().Where("student_id = ?", req.StudentID).First(&room).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบห้องที่จองโดยนักศึกษาคนนี้"})
		return
	}

	room.StudentID = nil
	room.Status = "ว่าง"
	room.BookingTime = time.Time{}

	if err := config.DB().Save(&room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ยกเลิกการจองไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ยกเลิกการจองสำเร็จ"})
}

// ดึง RoomType ทั้งหมด
func GetAllRoomType(c *gin.Context) {
	var list []entity.RoomType
	if err := config.DB().Find(&list).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, list)
}



