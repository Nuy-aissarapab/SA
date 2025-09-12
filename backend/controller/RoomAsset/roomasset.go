package roomasset

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/SA/config"
	"github.com/SA/entity"
)

// ดึง RoomAsset ทั้งหมด
func GetAllRoomAssets(c *gin.Context) {
	var roomAssets []entity.RoomAsset

	if err := config.DB().
		Preload("Room").
		Preload("Room.RoomType").
		Preload("Room.Student").
		Preload("AssetType").
		Find(&roomAssets).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, roomAssets)
}

// ดึง RoomAsset ตาม ID
func GetRoomAssetById(c *gin.Context) {
	id := c.Param("id")
	var roomAsset entity.RoomAsset

	if err := config.DB().
		Preload("Room").
		Preload("Room.RoomType").
		Preload("Room.Student").
		Preload("AssetType").
		First(&roomAsset, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ RoomAsset"})
		return
	}

	c.JSON(http.StatusOK, roomAsset)
}

// เพิ่ม RoomAsset
func CreateRoomAsset(c *gin.Context) {
	var req struct {
		RoomNumber  string `json:"room_number"`
		AssetTypeID uint   `json:"asset_type_id"`
		Quantity    int    `json:"quantity"`
		Condition   string `json:"condition"`
		Status      string `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var assetType entity.AssetType
	if err := config.DB().First(&assetType, req.AssetTypeID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบประเภททรัพย์สิน"})
		return
	}
	now := time.Now()
	roomAsset := entity.RoomAsset{
		RoomNumber:  req.RoomNumber,
		AssetTypeID: req.AssetTypeID,
		Quantity:    req.Quantity,
		
		
		CheckDate:   &now,
	}

	if err := config.DB().Create(&roomAsset).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึก RoomAsset ได้"})
		return
	}

	c.JSON(http.StatusCreated, roomAsset)
}

// อัปเดต RoomAsset
func UpdateRoomAsset(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Quantity  int       `json:"quantity"`
		Condition string    `json:"condition"`
		Status    string    `json:"status"`
		CheckDate *time.Time `json:"check_date"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var roomAsset entity.RoomAsset
	if err := config.DB().First(&roomAsset, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ RoomAsset"})
		return
	}

	roomAsset.Quantity = req.Quantity
	
	roomAsset.CheckDate = req.CheckDate

	if err := config.DB().Save(&roomAsset).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดต RoomAsset ได้"})
		return
	}

	c.JSON(http.StatusOK, roomAsset)
}

// ลบ RoomAsset
func DeleteRoomAsset(c *gin.Context) {
	id := c.Param("id")
	if tx := config.DB().Delete(&entity.RoomAsset{}, id); tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบ RoomAsset"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ลบ RoomAsset สำเร็จ"})
}

// ดึง AssetType ทั้งหมด
func GetAllAssetTypes(c *gin.Context) {
	var assetTypes []entity.AssetType
	if err := config.DB().Find(&assetTypes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึง AssetType ได้"})
		return
	}
	c.JSON(http.StatusOK, assetTypes)
}
// CreateAssetType - API สำหรับสร้างประเภททรัพย์สินใหม่
func CreateAssetType(c *gin.Context) {
	var assetType entity.AssetType

	// Bind JSON จาก frontend เข้ามา
	if err := c.ShouldBindJSON(&assetType); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// กำหนดวันที่สร้าง (กันพลาดถ้า frontend ไม่ส่ง)
	if assetType.Date.IsZero() {
		assetType.Date = time.Now()
	}

	// Save ลง Database
	if err := config.DB().Create(&assetType).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างประเภททรัพย์สินได้"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": assetType})
}// UpdateAssetType - แก้ไขประเภททรัพย์สิน
// UpdateAssetType - อัปเดตโดยใช้ข้อมูลจาก body (ไม่ใช้ param id)

func UpdateAssetType(c *gin.Context) {
    id := c.Param("id")

    var assetType entity.AssetType
    if err := config.DB().First(&assetType, id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบประเภททรัพย์สิน"})
        return
    }

    var input entity.AssetType
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }


    // อัปเดต field
    assetType.Name = input.Name
    assetType.Type = input.Type
    assetType.PenaltyFee = input.PenaltyFee
    assetType.Date = time.Now()

    if err := config.DB().Save(&assetType).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดตได้"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"data": assetType})
}
func DeleteAssetType(c *gin.Context) {
    id := c.Param("id")

    if tx := config.DB().Delete(&entity.AssetType{}, id); tx.RowsAffected == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบ AssetType"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "ลบ AssetType สำเร็จ"})
}
