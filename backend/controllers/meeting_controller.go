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

// CreateMeeting godoc
//	@Summary		Create a new meeting
//	@Description	Create a new meeting with the provided details
//	@Tags			Meetings
//	@Accept			json
//	@Produce		json
//	@Security		Bearer
//	@Param			meeting	body		models.Meeting		true	"Meeting data"
//	@Success		201		{object}	models.Meeting		"Meeting created successfully"
//	@Failure		400		{object}	map[string]string	"Invalid request"
//	@Failure		500		{object}	map[string]string	"Internal server error"
//	@Router			/api/meetings [post]
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

// GetMeetings godoc
//	@Summary		Get all meetings
//	@Description	Get list of all meetings
//	@Tags			Meetings
//	@Produce		json
//	@Security		Bearer
//	@Success		200	{array}		models.Meeting		"List of meetings"
//	@Failure		500	{object}	map[string]string	"Internal server error"
//	@Router			/api/meetings [get]
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

// GetUpcomingMeetings godoc
//	@Summary		Get upcoming meetings
//	@Description	Get list of meetings that are scheduled for today and haven't started yet, or are in the future
//	@Tags			Meetings
//	@Produce		json
//	@Security		Bearer
//	@Success		200	{array}		models.Meeting		"List of upcoming meetings"
//	@Failure		500	{object}	map[string]string	"Internal server error"
//	@Router			/api/meetings/upcoming [get]
func GetUpcomingMeetings(c *fiber.Ctx) error {
	now := time.Now()
	today := now.Format("2006-01-02")
	currentTime := now.Format("15:04")

	fmt.Printf("Fetching upcoming meetings from today: %s, current time: %s\n", today, currentTime)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Create aggregation pipeline to get upcoming meetings
	pipeline := []bson.M{
		// Get meetings that are either:
		// 1. Today but start time is in the future
		// 2. Future dates
		{
			"$match": bson.M{
				"$or": []bson.M{
					{
						"$and": []bson.M{
							{"date": today},
							{"time": bson.M{"$gte": currentTime}},
						},
					},
					{"date": bson.M{"$gt": today}},
				},
			},
		},
		// Sort by date, then by time
		{
			"$sort": bson.M{
				"date": 1,
				"time": 1,
			},
		},
	}

	cursor, err := config.MeetingCollectionRef.Aggregate(ctx, pipeline)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch upcoming meetings"})
	}
	defer cursor.Close(ctx)

	var meetings []models.Meeting
	if err := cursor.All(ctx, &meetings); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to decode meetings"})
	}

	fmt.Printf("Found %d upcoming meetings\n", len(meetings))

	// Build response with user details
	var meetingResponses []models.MeetingResponse
	for _, meeting := range meetings {
		response := populateMeetingResponse(meeting)
		meetingResponses = append(meetingResponses, response)
	}

	return c.Status(fiber.StatusOK).JSON(meetingResponses)
}

// GetTodayMeetings godoc
//	@Summary		Get today's meetings
//	@Description	Get list of meetings scheduled for today
//	@Tags			Meetings
//	@Produce		json
//	@Security		Bearer
//	@Success		200	{array}		models.Meeting		"List of today's meetings"
//	@Failure		500	{object}	map[string]string	"Internal server error"
//	@Router			/api/meetings/today [get]
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

// GetMeetingById godoc
//	@Summary		Get meeting by ID
//	@Description	Get meeting information by meeting ID
//	@Tags			Meetings
//	@Produce		json
//	@Security		Bearer
//	@Param			id	path		string					true	"Meeting ID"
//	@Success		200	{object}	models.MeetingResponse	"Meeting information"
//	@Failure		404	{object}	map[string]string		"Meeting not found"
//	@Failure		500	{object}	map[string]string		"Internal server error"
//	@Router			/api/meetings/{id} [get]
func GetMeetingById(c *fiber.Ctx) error {
	meetingID := c.Params("id")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var meeting models.Meeting
	var err error

	// Try with ObjectID first
	objectID, err := primitive.ObjectIDFromHex(meetingID)
	if err == nil {
		err = config.MeetingCollectionRef.FindOne(ctx, bson.M{"_id": objectID}).Decode(&meeting)
	}

	// Fall back to string ID if ObjectID fails
	if err != nil {
		err = config.MeetingCollectionRef.FindOne(ctx, bson.M{"_id": meetingID}).Decode(&meeting)
	}

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(404).JSON(fiber.Map{"error": "Meeting not found"})
		}
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch meeting"})
	}

	// Populate meeting response with user details
	response := populateMeetingResponse(meeting)

	return c.JSON(response)
}

// UpdateMeeting godoc
//	@Summary		Update meeting
//	@Description	Update meeting information by meeting ID
//	@Tags			Meetings
//	@Accept			json
//	@Produce		json
//	@Security		Bearer
//	@Param			id		path		string				true	"Meeting ID"
//	@Param			meeting	body		models.Meeting		true	"Meeting update data"
//	@Success		200		{object}	models.Meeting		"Meeting updated successfully"
//	@Failure		400		{object}	map[string]string	"Invalid request"
//	@Failure		404		{object}	map[string]string	"Meeting not found"
//	@Failure		500		{object}	map[string]string	"Internal server error"
//	@Router			/api/meetings/{id} [put]
func UpdateMeeting(c *fiber.Ctx) error {
	meetingID := c.Params("id")

	var updateData models.Meeting
	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request data"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Create update document
	update := bson.M{
		"$set": bson.M{
			"title":        updateData.Title,
			"description":  updateData.Description,
			"date":         updateData.Date,
			"time":         updateData.Time,
			"duration":     updateData.Duration,
			"allMembers":   updateData.AllMembers,
			"participants": updateData.Participants,
		},
	}

	var updateResult *mongo.UpdateResult
	var err error

	// Try with ObjectID first
	objectID, err := primitive.ObjectIDFromHex(meetingID)
	if err == nil {
		updateResult, err = config.MeetingCollectionRef.UpdateOne(ctx, bson.M{"_id": objectID}, update)
		if err == nil && updateResult.MatchedCount > 0 {
			return c.JSON(fiber.Map{"message": "Meeting updated successfully"})
		}
	}

	// Fall back to string ID
	updateResult, err = config.MeetingCollectionRef.UpdateOne(ctx, bson.M{"_id": meetingID}, update)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update meeting"})
	}

	if updateResult.MatchedCount == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Meeting not found"})
	}

	return c.JSON(fiber.Map{"message": "Meeting updated successfully"})
}

// DeleteMeeting godoc
//	@Summary		Delete meeting
//	@Description	Delete a meeting by meeting ID
//	@Tags			Meetings
//	@Produce		json
//	@Security		Bearer
//	@Param			id	path		string				true	"Meeting ID"
//	@Success		200	{object}	map[string]string	"Meeting deleted successfully"
//	@Failure		404	{object}	map[string]string	"Meeting not found"
//	@Failure		500	{object}	map[string]string	"Internal server error"
//	@Router			/api/meetings/{id} [delete]
func DeleteMeeting(c *fiber.Ctx) error {
	meetingID := c.Params("id")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var deleteResult *mongo.DeleteResult
	var err error

	// Try with ObjectID first
	objectID, err := primitive.ObjectIDFromHex(meetingID)
	if err == nil {
		deleteResult, err = config.MeetingCollectionRef.DeleteOne(ctx, bson.M{"_id": objectID})
		if err == nil && deleteResult.DeletedCount > 0 {
			return c.JSON(fiber.Map{"message": "Meeting deleted successfully"})
		}
	}

	// Fall back to string ID
	deleteResult, err = config.MeetingCollectionRef.DeleteOne(ctx, bson.M{"_id": meetingID})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete meeting"})
	}

	if deleteResult.DeletedCount == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "Meeting not found"})
	}

	return c.JSON(fiber.Map{"message": "Meeting deleted successfully"})
}
