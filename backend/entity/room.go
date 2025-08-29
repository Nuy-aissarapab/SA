package entity

import (
	"time"
	"gorm.io/gorm"
)

type Room struct {
	gorm.Model
	Rental_Price	float64 	`json:"rental_price"`
	Room_Status		string 		`json:"room_status"`
	Last_Update		time.Time	`json:"last_update"`
	Floor			int 		`json:"floor"`
	Image			string 		`json:"image"`

	// 1 room อยู่ได้หลาย student
	Student []Student `gorm:"foreignKey:Room_ID"`

	// หลาย room อยู่ได้หลาย admin
	Admin []Admin `gorm:"many2many:Room_ID"`

	// 1 Room_ID มีได้หลาย Contract
	Contract []Contract `gorm:"foreignKey:Room_ID"`
}