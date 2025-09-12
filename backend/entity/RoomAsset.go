package entity

import (
    "gorm.io/gorm"
    "time"
)

// entity/room_asset.go
type RoomAsset struct {
    gorm.Model
    Quantity   int        `json:"Quantity"`
    CheckDate  *time.Time `json:"CheckDate"`

    RoomNumber  string `json:"RoomNumber" gorm:"not null;index"`
    AssetTypeID uint   `json:"AssetTypeID" gorm:"not null"`

    // อ้าง "ชื่อฟิลด์" ไม่ใช่ชื่อคอลัมน์
    Room      Room      `json:"Room" gorm:"foreignKey:RoomNumber;references:RoomNumber;constraint:OnUpdate:CASCADE,OnDelete:SET NULL"`
    AssetType AssetType `json:"AssetType" gorm:"foreignKey:AssetTypeID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
}
