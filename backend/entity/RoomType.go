package entity

import "gorm.io/gorm"

type RoomType struct {
    gorm.Model
    RoomTypeName string  `json:"RoomTypeName"`
    RentalPrice  float64 `json:"RentalPrice"`

    // Relations
    Rooms []Room `json:"Rooms" gorm:"foreignKey:RoomTypeID"`
}//kuy2
