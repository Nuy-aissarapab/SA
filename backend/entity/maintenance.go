package entity

import (
	"time"
	"gorm.io/gorm"
)

type MaintenanceRequest struct {
	gorm.Model
	Title         string            `json:"title"`
	Description   string            `json:"description"`
	PhotoURL      string            `json:"photo_url"`
	RequestDate   time.Time         `json:"request_date"`
	
	Room_ID *uint
	Room   Room `gorm:"foriegnKey:Room_ID"`

	Student_ID *uint
	Student Student `gorm:"foriegnKey:Student_ID"`

	Admin_ID *uint
	Admin   Admin `gorm:"foriegnKey:Admin_ID"`

	ProblemType_ID *uint
	ProblemType ProblemType `gorm:"foriegnKey:ProblemType_ID"`	

	MaintenanceStatus_ID *uint
	MaintenanceStatus MaintenanceStatus `gorm:"foriegnKey:MaintenanceStatus_ID"`
}