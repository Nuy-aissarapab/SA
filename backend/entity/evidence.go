package entity

import (
	"time"
	"gorm.io/gorm"
)

type Evidence struct {
    gorm.Model
    File      string    `json:"file"`
    Note      string    `json:"note"`   
    Date      time.Time `json:"date"`

    // FK → Student
    StudentID uint
    Student   Student `gorm:"foreignKey:StudentID" json:"student"`

    // FK → Payment
    PaymentID uint `json:"payment_id"`
    // Payment   Payment `gorm:"foreignKey:PaymentID" json:"payment"`
}

