package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Meeting struct {
	ID           primitive.ObjectID   `json:"id" bson:"_id,omitempty"`
	Title        string               `json:"title" bson:"title"`
	Description  string               `json:"description" bson:"description"`
	Date         string               `json:"date" bson:"date"`
	Time         string               `json:"time" bson:"time"`
	Duration     int                  `json:"duration" bson:"duration"`
	CreatedBy    primitive.ObjectID   `json:"createdBy" bson:"createdBy"`
	CreatedAt    time.Time            `json:"createdAt" bson:"createdAt"`
	AllMembers   bool                 `json:"allMembers" bson:"allMembers"`
	Participants []primitive.ObjectID `json:"participants" bson:"participants"`
}

type MeetingResponse struct {
	ID           primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Title        string             `json:"title" bson:"title"`
	Description  string             `json:"description" bson:"description"`
	Date         string             `json:"date" bson:"date"`
	Time         string             `json:"time" bson:"time"`
	Duration     int                `json:"duration" bson:"duration"`
	CreatedBy    User               `json:"createdBy" bson:"createdBy"`
	CreatedAt    time.Time          `json:"createdAt" bson:"createdAt"`
	AllMembers   bool               `json:"allMembers" bson:"allMembers"`
	Participants []User             `json:"participants" bson:"participants"`
}
