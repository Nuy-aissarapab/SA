package entity

import "gorm.io/gorm"

type ReviewTopic struct {
	gorm.Model
	TopicName string   `gorm:"unique" json:"topic_name"`
	Reviews   []Review `gorm:"foreignKey:ReviewTopicID"`

	
}
