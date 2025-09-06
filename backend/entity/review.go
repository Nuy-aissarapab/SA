package entity

import (
	"time"
	"gorm.io/gorm"
)

type Review struct {
	gorm.Model
	Title      string    `json:"title"`
	Comment    string    `json:"comment"`
	Rating     int       `json:"rating"`
	ReviewDate time.Time `json:"review_date"`

	StudentID     *uint       `json:"student_id"`
	Student       Student     `gorm:"foreignKey:StudentID" json:"student"`

	ReviewTopicID *uint       `json:"review_topic_id"`
	ReviewTopic   ReviewTopic `gorm:"foreignKey:ReviewTopicID" json:"review_topic"`

	RoomID *uint `json:"room_id"`
    Room   Room  `gorm:"foreignKey:RoomID" json:"room"`
	
}
