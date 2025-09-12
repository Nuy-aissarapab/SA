package bill

import (
	"net/http"
	"strconv"
	"time"
	"gorm.io/gorm"
	"github.com/SA/config"
	"github.com/SA/entity"
	"github.com/gin-gonic/gin"
)
//kuyy
// ======================== Structs ========================
type BillCreateRequest struct {
    RoomID  uint            `json:"room_id"`
    DueDate time.Time       `json:"due_date"`
    Items   []BillItemInput `json:"items"` // <--- เพิ่มตรงนี้
}

// BillItemInput เป็น struct สำหรับรับจาก frontend
type BillItemInput struct {
    ItemType string  `json:"item_type"`
    Amount   float64 `json:"amount"`
}
type PreviewBillRequest struct {
	DueDate time.Time `json:"due_date"`
}

type PreviewBillItem struct {
	ItemType string  `json:"item_type"`
	Amount   float64 `json:"amount"`
	Selected bool    `json:"selected"` // default false
}

// ======================== Handlers ========================

func GetBillByRoom(c *gin.Context) {
	roomIDStr := c.Param("room_id")
	if roomIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "room_id is required"})
		return
	}

	roomID, err := strconv.Atoi(roomIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid room_id"})
		return
	}

	var bills []entity.Billing
	db := config.DB()
	result := db.
		Preload("Room").
		Preload("BillItem").
		Preload("Payment").
		Where("room_id = ?", roomID).
		Find(&bills)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	if len(bills) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "bills not found"})
		return
	}

	c.JSON(http.StatusOK, bills)
}

func DeleteBill(c *gin.Context) {
	idStr := c.Param("id")
	var bill entity.Billing

	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	db := config.DB()
	tx := db.Where("id = ?", id).Delete(&bill)

	if tx.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bill not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deleted successful"})
}

// ======================== Create Bill ========================
func CreateBill(c *gin.Context) {
	var req BillCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// หา student ของห้องนี้ (ถ้ามี)
	var student entity.Student
	_ = db.Where("room_id = ?", req.RoomID).First(&student) // ignore error ถ้าไม่มี student ก็ยังทำได้

	status := "ค้างชำระ"
	var createdBill entity.Billing

	err := db.Transaction(func(tx *gorm.DB) error {
		newBill := entity.Billing{
			BillingDate: time.Now(),
			DueDate:     req.DueDate,
			Status:      &status,
			RoomID:      req.RoomID,
		}

		if student.ID != 0 {
			newBill.StudentID = student.ID
		}

		// สร้าง billing
		if err := tx.Create(&newBill).Error; err != nil {
			return err
		}

		// สร้าง BillItem จาก payload ของ frontend
		var items []entity.BillItem
for i := range req.Items {
    items = append(items, entity.BillItem{
        BillingID: newBill.ID,        // ใช้ ID ของบิลที่สร้างแล้ว
        ItemType:  req.Items[i].ItemType,
        Amount:    req.Items[i].Amount,
    })
}

if len(items) > 0 {
    if err := tx.Create(&items).Error; err != nil {
        return err
    }
}

		// โหลดข้อมูล bill พร้อม items เพื่อส่งกลับ
		if err := tx.Preload("BillItem").First(&newBill, newBill.ID).Error; err != nil {
			return err
		}

		// อัปเดต AmountDue = ผลรวมของ BillItem
		var total float64
		for _, item := range newBill.BillItem {
			total += item.Amount
		}
		newBill.AmountDue = total
		if err := tx.Save(&newBill).Error; err != nil {
			return err
		}

		createdBill = newBill
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, createdBill)
}


// ======================== Preview Bill ========================
func PreviewBill(c *gin.Context) {
	roomIdStr := c.Param("room_id")
	roomId, err := strconv.Atoi(roomIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid room_id"})
		return
	}

	var req PreviewBillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	var items []PreviewBillItem

	// =================== MeterRecords ===================
	var meterRecords []entity.MeterRecord
	if err := db.Preload("MeterType").Where("room_id = ?", roomId).Find(&meterRecords).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for _, record := range meterRecords {
		if record.MeterType.ID != 0 {
			items = append(items, PreviewBillItem{
				ItemType: record.MeterType.MeterName,
				Amount:   record.TotalAmount,
			})
		}
	}

	// =================== Room Rental ===================
	var room entity.Room
	if err := db.Preload("RoomType").Preload("RoomAsset.AssetType").First(&room, roomId).Error; err == nil {
		if room.RoomType.RentalPrice > 0 {
			items = append(items, PreviewBillItem{
				ItemType: "Room",
				Amount:   room.RoomType.RentalPrice,
			})
		}

		// =================== Room Assets ===================
		var roomAssets []entity.RoomAsset
		if err := db.Preload("AssetType").Where("room_number = ?", room.RoomNumber).Find(&roomAssets).Error; err == nil {
	for _, ra := range roomAssets {
		if ra.AssetType.ID != 0 && ra.AssetType.PenaltyFee > 0 {
			items = append(items, PreviewBillItem{
				ItemType: "ค่าปรับทรัพย์สิน:" + ra.AssetType.Name,
				Amount:   ra.AssetType.PenaltyFee,
			})
		}
	}
}


	c.JSON(http.StatusOK, gin.H{
		"due_date": req.DueDate,
		"items":    items,
	})
}
}


// ======================== PreviewBillItems (API สำหรับ Frontend) ========================


// เพิ่ม Selected field ให้ frontend ใช้ checkbox


func PreviewBillItems(c *gin.Context) {
	roomIdStr := c.Param("room_id")
	roomId, err := strconv.Atoi(roomIdStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "room_id ไม่ถูกต้อง"})
		return
	}

	dueDate := c.Query("dueDate")

	db := config.DB()
	var items []PreviewBillItem

	// ================= ค่าไฟ =================
	var lastElec entity.MeterRecord
	if err := db.Where("room_id = ? AND meter_type_id = ?", roomId, 1).
		Order("record_date DESC").First(&lastElec).Error; err == nil {
		items = append(items, PreviewBillItem{
			ItemType: "Electricity",
			Amount:   lastElec.TotalAmount,
			Selected: true, // รายการหลัก default true
		})
	}

	// ================= ค่าน้ำ =================
	var lastWater entity.MeterRecord
	if err := db.Where("room_id = ? AND meter_type_id = ?", roomId, 2).
		Order("record_date DESC").First(&lastWater).Error; err == nil {
		items = append(items, PreviewBillItem{
			ItemType: "Water",
			Amount:   lastWater.TotalAmount,
			Selected: true, // รายการหลัก default true
		})
	}

	// ================= ค่าเช่าห้อง =================
	var room entity.Room
	if err := db.Preload("RoomType").First(&room, roomId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบห้อง"})
		return
	}

	if room.RoomType.RentalPrice > 0 {
		items = append(items, PreviewBillItem{
			ItemType: "Room",
			Amount:   room.RoomType.RentalPrice,
			Selected: true, // รายการหลัก default true
		})
	}

	// ================= Extra Assets / PenaltyFee =================
	var roomAssets []entity.RoomAsset
	if err := db.Preload("AssetType").Where("room_number = ?", room.RoomNumber).Find(&roomAssets).Error; err == nil {
		for _, ra := range roomAssets {
			if ra.AssetType.ID != 0 && ra.AssetType.PenaltyFee > 0 {
				items = append(items, PreviewBillItem{
					ItemType: "ค่าปรับทรัพย์สิน:" + ra.AssetType.Name,
					Amount:   ra.AssetType.PenaltyFee,
					Selected: false, // default ไม่เลือก
				})
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"due_date": dueDate,
		"items":    items,
	})
}



