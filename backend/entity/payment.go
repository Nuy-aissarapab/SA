package entity

import (
	"time"
	"gorm.io/gorm"
)

type Payment struct {
    gorm.Model
    Payment_Date   time.Time `json:"start_date"`
    Amount         float64   `json:"amount" gorm:"type:decimal(10,2)"`
    Payment_Status string    `json:"payment_status"`

    // Foreign key → Student
    StudentID uint
    Student   Student `gorm:"foreignKey:StudentID" json:"student"`

    // FK ไปที่ Billing
	BillingID uint
	Billing   Billing `gorm:"foreignKey:BillingID"`
}
