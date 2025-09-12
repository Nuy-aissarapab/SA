package entity

import (
	"time"
	"gorm.io/gorm"
)
	type MeterRecord struct {
    gorm.Model
    ID           uint       `json:"id"`
    RecordDate   time.Time  `json:"record_date"`
    OldValue     float64    `json:"old_value" gorm:"type:decimal(10,2)"`
    NewValue     float64    `json:"new_value" gorm:"type:decimal(10,2)"`
    UnitUsed     float64    `json:"unit_used" gorm:"type:decimal(10,2)"`
    TotalAmount  float64    `json:"total_amount" gorm:"type:decimal(10,2)"`

    MeterTypeID *uint       `json:"meter_type_id"`
    MeterType   MeterType   `json:"meter_type" gorm:"foreignKey:MeterTypeID"`

    RateID      *uint       `json:"rate_id"`
    RatePerUnit RatePerUnit `json:"rate_per_unit" gorm:"foreignKey:RateID"`

    RoomID *uint            `json:"room_id"`
    Room   Room             `json:"room" gorm:"foreignKey:RoomID"`

    StudentID *uint         `json:"student_id"`
    Student   Student       `json:"student" gorm:"foreignKey:StudentID"`
}