package entity

import (
    "gorm.io/gorm"
    "time"
)

type Room struct {
    gorm.Model
    RoomNumber  string    `json:"room_number"`
    Status      string    `json:"room_status"`
    Image       string    `json:"image"`
    BookingTime time.Time `json:"BookingTime"`
    LastUpdated time.Time  `json:"last_updated"`

    // Foreign Keys
    RoomTypeID uint  
    StudentID  *uint 
    AdminID    uint  

    // Relations
    RoomType  *RoomType   `gorm:"foreignKey:RoomTypeID"`
    Student   *Student    `gorm:"foreignKey:StudentID"`
    Admin     *Admin      `gorm:"foreignKey:AdminID"`
    RoomAsset []RoomAsset `gorm:"foreignKey:RoomNumber;references:RoomNumber"`
}
