package entity

import (
    "time"
    "gorm.io/gorm"
)

type Maintenance struct {
    gorm.Model
    Title      string    `json:"title"`
    Detail     string    `json:"detail"`
    ReportDate time.Time `json:"report_date"`

    ImageURL  *string `json:"image_url"`
    ImageName *string `json:"image_name"`

    StudentID *uint   `json:"student_id"`
    Student   Student `gorm:"foreignKey:StudentID" json:"student"`

    RoomID *uint `json:"room_id"`
    Room   Room  `gorm:"foreignKey:RoomID" json:"room"`

    ProblemTypeID *uint       `json:"problem_type_id"`
    ProblemType   ProblemType `gorm:"foreignKey:ProblemTypeID" json:"problem_type"`

    MaintenanceStatusID *uint             `json:"maintenance_status_id"`
    MaintenanceStatus   MaintenanceStatus `gorm:"foreignKey:MaintenanceStatusID" json:"maintenance_status"`
}
