package entity

import (
	"gorm.io/gorm"
)

type AnnouncementTarget struct {
	gorm.Model
	Name        string
	Announcements []Announcement `gorm:"foreignKey:AnnouncementTargetID"`
}
