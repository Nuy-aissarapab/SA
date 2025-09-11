package entity

import (
    "gorm.io/gorm"
    "time"
)

type AssetType struct {
    gorm.Model
    Name       string    `json:"Name"`
    Type       string    `json:"Type"`
    PenaltyFee float64   `json:"PenaltyFee"`
    Date       time.Time `json:"Date"`

    // Relations
    RoomAssets []RoomAsset `json:"RoomAssets" gorm:"foreignKey:AssetTypeID"`
}
