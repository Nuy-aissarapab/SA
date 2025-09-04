package entity

import (
	"time"
	"gorm.io/gorm"
)

type Room struct {
	gorm.Model
	RoomNumber		string 		`json:"room_number"`
	Status			string 		`json:"room_status"`
	Image			string 		`json:"image"`
	LastUpdated		time.Time 	`json:"last_updated"`

	AdminID *uint
	Admin   Admin `gorm:"foreignKey:AdminID"`


}
