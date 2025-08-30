package entity

import (
	"gorm.io/gorm"
)

type AnnouncementType struct {
	gorm.Model
	Name          string
	Announcements []Announcement `gorm:"foreignKey:AnnouncementTypeID"`
}
