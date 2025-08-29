package entity

import (
	"time"
	"gorm.io/gorm"
)

type Billing struct {
	gorm.Model
	Billing_date	time.Time	`json:"Billing_date"`
	Invoice			time.Time	`json:"invoice"`
	Due_Date		time.Time	`json:"due_Date"`
	Status		 	string		`json:"status"`

	// Foreign key → Student
    StudentID uint
    Student   Student `gorm:"foreignKey:StudentID" json:"student"`

	// 1 Billing มีได้หลาย Payment
	Payment []Payment `gorm:"foriegnKey:Billing_ID"`

	// FK ไปที่ Contract
	ContractID uint
	Contract   Contract `gorm:"foreignKey:ContractID"`

}