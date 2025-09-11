package entity

import (
    "gorm.io/gorm"
    "time"
)

type RoomAsset struct {
    gorm.Model
    Quantity    int       `json:"Quantity"`
    Condition   string    `json:"Condition"`
    Status      string    `json:"Status"`
    CreatedDate time.Time `json:"CreatedDate"`
    CheckDate   time.Time `json:"CheckDate"`

    // Foreign Keys
    RoomNumber  string `json:"RoomNumber"`
    AssetTypeID uint   `json:"AssetTypeID"`

    // Relations
    Room      Room      `json:"Room" gorm:"foreignKey:RoomNumber;references:room_number"`
    AssetType AssetType `json:"AssetType" gorm:"foreignKey:AssetTypeID;references:ID"`
}
