
package entity

import (
    "gorm.io/gorm"
    "time"
)

type Room struct {
    gorm.Model
    RoomNumber  string    `gorm:"uniqueIndex"`
    Status      string  
    Image       string   
    BookingTime time.Time 

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
