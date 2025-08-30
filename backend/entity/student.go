package entity

import (
	"time"

	"gorm.io/gorm"
)

type Student struct {
	//ข้อมูลพื้นฐานเลย เช่น รหัสนักศึกษา ชื่อ-นามสกุล คณะ เบอร์โทร อีเมล และเลขห้องที่พักอยู่ตอนนี้
	gorm.Model
	Username 	 string 	`json:"username"`
	Password 	 string		`json:"password"`
	Email	 	 string		`json:"email"`
	First_Name 	 string		`json:"first_name"`
	Last_Name    string  	`json:"last_name"`
	Birthday	 time.Time	`json:"birthday"`
	Phone		 string		`json:"phone"`
	Parent_Phone string		`json:"parent_phone"`
	Parent_Name  string		`json:"parent_name"`
	Major		 string		`json:"major"`

	// หลาย student มีได้หลาย Billing
	Billings []Billing `gorm:"foreignKey:StudentID"`

	// MemberID ทำหน้าที่เป็น FK
	Room_ID *uint
	Room   Room `gorm:"foreignKey:Room_ID"`

	Contract []Contract `gorm:"foreignKey:StudentID"`
	// Contract_ID ทำหน้าที่เป็น FK

	Payments []Payment `gorm:"foreignKey:StudentID"`
}
