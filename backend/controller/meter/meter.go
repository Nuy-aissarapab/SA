package meter

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "github.com/SA/config"
    "github.com/SA/entity"
    "time"
    "gorm.io/gorm"
    "strconv"
     "errors"   
)


func Getmeter(c *gin.Context) {
    var meter []entity.MeterRecord
    db := config.DB()

    results := db.Preload("Student").
        Preload("MeterType").
        Preload("Room").
        Preload("RatePerUnit").
        Joins("LEFT JOIN rooms ON rooms.id = meter_records.room_id").
        Order("rooms.room_number ASC").
        Find(&meter)

    if results.Error != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
        return
    }

    c.JSON(http.StatusOK, meter)
}


func GetMeterByRoom(c *gin.Context) {
    // 1. ดึง room_id จาก URL
    roomIDStr := c.Param("room_id")
    if roomIDStr == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "room_id is required"})
        return
    }

    // 2. แปลงเป็น int
    roomID, err := strconv.Atoi(roomIDStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid room_id"})
        return
    }

    // 3. Query DB
    var meters []entity.MeterRecord
    db := config.DB()
    result := db.Preload("Student").
        Preload("Room").
        Preload("MeterType").
        Where("room_id = ?", roomID).
        Find(&meters)

    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        return
    }

    // 4. เช็คว่าเจอข้อมูลหรือไม่
    if len(meters) == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "meters not found"})
        return
    }

    // 5. ส่งข้อมูลกลับ
    c.JSON(http.StatusOK, meters)
}

type MeterCreateRequest struct {
    RoomID      uint    `json:"room_id"`       // รหัสห้อง
    MeterTypeID uint    `json:"meter_type_id"` // ประเภทมิเตอร์
    NewValue    float64 `json:"new_value"`
    RateID      *uint   `json:"rate_id,omitempty"` // เพิ่ม field นี้
}



func CreateMeter(c *gin.Context) {
    var req MeterCreateRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    db := config.DB()

    // หา student ในห้องนั้น
    var student entity.Student
    db.Where("room_id = ?", req.RoomID).First(&student)

    // หา record ล่าสุดของห้อง + meter type
    var last entity.MeterRecord
    db.Where("room_id = ? AND meter_type_id = ?", req.RoomID, req.MeterTypeID).
        Order("record_date DESC").
        First(&last)

    // หา rate ต่อหน่วย
    var rate entity.RatePerUnit
    pricePerUnit := 1.0 // default
    if err := db.Where("meter_type_id = ?", req.MeterTypeID).First(&rate).Error; err == nil {
        pricePerUnit = rate.PricePerUnit
    }

    // สร้าง MeterRecord ใหม่
    newRecord := entity.MeterRecord{
        RecordDate:  time.Now(),
        OldValue:    last.NewValue,
        NewValue:    req.NewValue,
        UnitUsed:    req.NewValue - last.NewValue,
        TotalAmount: (req.NewValue - last.NewValue) * pricePerUnit,
        RateID:      &rate.ID,
        MeterTypeID: &req.MeterTypeID,
        RoomID:      &req.RoomID,
    }

    if student.ID != 0 {
        newRecord.StudentID = &student.ID
    }

    if err := db.Create(&newRecord).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, newRecord)
}

// ดึงค่า MeterRecord ล่าสุดของห้องและประเภทมิเตอร์
func GetLastMeterRecord(c *gin.Context) {
    roomIDStr := c.Query("room_id")
    meterTypeIDStr := c.Query("meter_type_id")

    roomID, err := strconv.Atoi(roomIDStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "room_id ไม่ถูกต้อง"})
        return
    }

    meterTypeID, err := strconv.Atoi(meterTypeIDStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "meter_type_id ไม่ถูกต้อง"})
        return
    }

    db := config.DB()
    var lastRecord entity.MeterRecord

    err = db.Where("room_id = ? AND meter_type_id = ?", roomID, meterTypeID).
        Order("record_date DESC").
        First(&lastRecord).Error

    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            // ไม่มีค่าเดิม
            c.JSON(http.StatusOK, gin.H{"new_value": 0})
            return
        }
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
    "last_value": lastRecord.NewValue, // ชัดเจน
})
}



func GetMeterById(c *gin.Context) {
    idStr := c.Param("id")
    id, err := strconv.Atoi(idStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
        return
    }

    var meter entity.MeterRecord
    db := config.DB()
    result := db.Preload("MeterType").Preload("Room").First(&meter, id)
    if result.Error != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "meter record not found"})
        return
    }

    c.JSON(http.StatusOK, meter)
}


  

// ✅ Update MeterRecord
type UpdateMeterPayload struct {
    MeterTypeID *uint   `json:"meter_type_id"`
    NewValue    float64 `json:"new_value"`
}

func UpdateMeter(c *gin.Context) {
    var meter entity.MeterRecord
    meterID := c.Param("id")

    db := config.DB()

    // ค้นหามิเตอร์ก่อน
    result := db.First(&meter, meterID)
    if result.Error != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "meter record not found"})
        return
    }

    // bind JSON มาเฉพาะ field ที่อนุญาต
    var payload struct {
        MeterTypeID *uint   `json:"meter_type_id"`
        NewValue    float64 `json:"new_value"`
    }

    if err := c.ShouldBindJSON(&payload); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request, unable to map payload"})
        return
    }

    // อัพเดต field ที่อนุญาต
    if payload.MeterTypeID != nil {
        meter.MeterTypeID = payload.MeterTypeID
    }
    meter.NewValue = payload.NewValue

    // บันทึกการเปลี่ยนแปลง
    result = db.Save(&meter)
    if result.Error != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to update meter record"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Updated successful"})
}



// ✅ Delete MeterRecord
func DeleteMeter(c *gin.Context) {
    idStr := c.Param("id")
    var last entity.MeterRecord
    id, err := strconv.Atoi(idStr)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
        return
    }

    db := config.DB()
    tx := db.Where("id = ?", id).Delete(&last) // แก้ struct ให้ตรง entity

    if tx.RowsAffected == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "meter record not found"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Deleted successful"})
}


