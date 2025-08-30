package entity

import (
	"gorm.io/gorm"
)

type Announcement struct {
	gorm.Model
	Title       string
	Content     string
	Picture     string

	AdminID     uint
	Admin       Admin `gorm:"foreignKey:AdminID"`

	AnnouncementsTargetID uint
	AnnouncementsTarget   AnnouncementTarget `gorm:"foreignKey:AnnouncementsTargetID"`
	
 
	AnnouncementTypeID uint
	AnnouncementType   AnnouncementType `gorm:"foreignKey:AnnouncementTypeID"`
}
