package controllers

import (
	"backend/config"
	"backend/models"
	"context"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// CreateMeeting creates a new meeting
func CreateMeeting(c *fiber.Ctx) error {
	// Parse request body
	var meeting models.Meeting
	if err := c.BodyParser(&meeting); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request data"})
	}

	// Get user ID from JWT token
	user := c.Locals("user").(jwt.MapClaims)
	userID, ok := user["id"].(string)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	// Convert user ID to ObjectID
	creatorID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID format"})
	}

	// Set meeting data
	meeting.CreatedBy = creatorID
	meeting.CreatedAt = time.Now()

	// Generate new ObjectID if not provided
	if meeting.ID.IsZero() {
		meeting.ID = primitive.NewObjectID()
	}

	// Insert meeting into database
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err = config.MeetingCollectionRef.InsertOne(ctx, meeting)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create meeting"})
	}

	fmt.Println("Meeting created:", meeting.ID)

	return c.Status(fiber.StatusCreated).JSON(meeting)
}

// GetMeetings returns all meetings
func GetMeetings(c *fiber.Ctx) error {
	// Set context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	fmt.Println("Fetching all meetings")

	// Find all meetings
	cursor, err := config.MeetingCollectionRef.Find(ctx, bson.M{})
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Return empty array if no meetings
			return c.Status(fiber.StatusOK).JSON([]interface{}{})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch meetings"})
	}
	defer cursor.Close(ctx)

	// Decode meetings
	var meetings []models.Meeting
	if err := cursor.All(ctx, &meetings); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to decode meetings"})
	}

	fmt.Printf("Found %d meetings\n", len(meetings))

	// Build response with user details
	var meetingResponses []models.MeetingResponse
	for _, meeting := range meetings {
		response := populateMeetingResponse(meeting)
		meetingResponses = append(meetingResponses, response)
	}

	return c.Status(fiber.StatusOK).JSON(meetingResponses)
}

// GetTodayMeetings returns meetings for today
func GetTodayMeetings(c *fiber.Ctx) error {
	// Get current date
	now := time.Now()
	today := now.Format("2006-01-02")

	fmt.Printf("Fetching meetings for today: %s\n", today)

	// Set context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Find today's meetings
	cursor, err := config.MeetingCollectionRef.Find(ctx, bson.M{"date": today})
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Return empty array if no meetings
			return c.Status(fiber.StatusOK).JSON([]interface{}{})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch today's meetings"})
	}
	defer cursor.Close(ctx)

	// Decode meetings
	var meetings []models.Meeting
	if err := cursor.All(ctx, &meetings); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to decode meetings"})
	}

	fmt.Printf("Found %d meetings for today\n", len(meetings))

	// Build response with user details
	var meetingResponses []models.MeetingResponse
	for _, meeting := range meetings {
		response := populateMeetingResponse(meeting)
		meetingResponses = append(meetingResponses, response)
	}

	return c.Status(fiber.StatusOK).JSON(meetingResponses)
}

// Helper function to populate meeting response with user details
func populateMeetingResponse(meeting models.Meeting) models.MeetingResponse {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	response := models.MeetingResponse{
		ID:          meeting.ID,
		Title:       meeting.Title,
		Description: meeting.Description,
		Date:        meeting.Date,
		Time:        meeting.Time,
		Duration:    meeting.Duration,
		CreatedAt:   meeting.CreatedAt,
		AllMembers:  meeting.AllMembers,
	}

	// Get creator details
	var creator models.User
	err := config.UserCollectionRef.FindOne(ctx, bson.M{"_id": meeting.CreatedBy}).Decode(&creator)
	if err == nil {
		// Fix profileImage URL if it exists
		if creator.ProfileImage != "" && !IsAbsoluteURL(creator.ProfileImage) {
			creator.ProfileImage = "/uploads/" + GetFilenameFromPath(creator.ProfileImage)
		}
		response.CreatedBy = creator
	} else {
		fmt.Printf("Error fetching creator: %v\n", err)
		response.CreatedBy = models.User{
			Nama: "Unknown User",
		}
	}

	// Get participants details
	if !meeting.AllMembers {
		var participants []models.User
		for _, participantID := range meeting.Participants {
			var participant models.User
			err := config.UserCollectionRef.FindOne(ctx, bson.M{"_id": participantID}).Decode(&participant)
			if err == nil {
				// Fix profileImage URL if it exists
				if participant.ProfileImage != "" && !IsAbsoluteURL(participant.ProfileImage) {
					participant.ProfileImage = "/uploads/" + GetFilenameFromPath(participant.ProfileImage)
				}
				participants = append(participants, participant)
			} else {
				fmt.Printf("Error fetching participant: %v\n", err)
			}
		}
		response.Participants = participants
	} else {
		// If all members are included, get all users
		cursor, err := config.UserCollectionRef.Find(ctx, bson.M{})
		if err == nil {
			var allUsers []models.User
			if err = cursor.All(ctx, &allUsers); err == nil {
				// Fix profileImage URLs
				for i, user := range allUsers {
					if user.ProfileImage != "" && !IsAbsoluteURL(user.ProfileImage) {
						allUsers[i].ProfileImage = "/uploads/" + GetFilenameFromPath(user.ProfileImage)
					}
				}
				response.Participants = allUsers
			}
			cursor.Close(ctx)
		} else {
			fmt.Printf("Error fetching all users: %v\n", err)
		}
	}

	return response
}

// Helper function to check if URL is absolute
func IsAbsoluteURL(url string) bool {
	return len(url) > 7 && (url[:7] == "http://" || url[:8] == "https://")
}

// Helper function to get filename from path
func GetFilenameFromPath(path string) string {
	// If path already has /uploads/ prefix, return as is
	if len(path) > 8 && path[:8] == "/uploads" {
		return path[9:]
	}
	return path
}
