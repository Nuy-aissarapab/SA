package entity

import (
	"time"
	"gorm.io/gorm"
)

type Contract struct {
	gorm.Model
	Start_Date time.Time `json:"start_date"`
	End_Date   time.Time `json:"end_date"`
	Rate       float64   `json:"rate" gorm:"type:decimal(10,2)"`

	// One Contract มีได้หลาย Billing
	Billings []Billing `gorm:"foreignKey:ContractID"`

	// 1 Contract → 1 Room
	Room_ID *uint
	Room    Room `gorm:"foreignKey:Room_ID"`

	// 1 Contract → 1 Admin
	Admin_ID *uint
	Admin    Admin `gorm:"foreignKey:Admin_ID"`

	// 1 Contract → 1 Student
	StudentID *uint
	Student   Student `gorm:"foreignKey:StudentID"`
}
