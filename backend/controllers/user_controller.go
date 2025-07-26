package controllers

import (
	"context"
	"fmt"
	"os"
	"time"

	"backend/config"
	// "backend/middleware"
	"backend/models"
	"backend/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// GetTeamMembers godoc
//
//	@Summary		Get team members
//	@Description	Get list of team members with additional information
//	@Tags			Users
//	@Produce		json
//	@Security		Bearer
//	@Success		200	{array}		models.UserResponse	"List of team members"
//	@Failure		500	{object}	map[string]string	"Internal server error"
//	@Router			/api/team-members [get]
//
// Mendapatkan daftar pengguna dengan informasi tambahan
func GetTeamMembers(c *fiber.Ctx) error {
	var users []models.UserResponse

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := config.UserCollectionRef.Find(ctx, bson.M{})
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var user models.User
		if err := cursor.Decode(&user); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		// Convert to user response without password
		userResponse := models.UserResponse{
			ID:         user.ID,
			Nama:       user.Nama,
			Email:      user.Email,
			Role:       "Team Member", // Default role
			Status:     "Online",      // Placeholder
			LastActive: time.Now(),    // Placeholder
		}

		users = append(users, userResponse)
	}

	return c.Status(200).JSON(users)
}

// GetUsers godoc
//
//	@Summary		Get all users
//	@Description	Get list of all users in the system
//	@Tags			Users
//	@Produce		json
//	@Success		200	{array}		models.User			"List of users"
//	@Failure		500	{object}	map[string]string	"Internal server error"
//	@Router			/users [get]
//
// Make sure this function is correctly implemented
func GetUsers(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := config.UserCollectionRef.Find(ctx, bson.M{})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch users: " + err.Error(),
		})
	}
	defer cursor.Close(ctx)

	var users []models.User
	if err := cursor.All(ctx, &users); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to parse users data: " + err.Error(),
		})
	}

	// Convert to safe response without passwords
	var safeUsers []fiber.Map
	for _, user := range users {
		// Ensure role is not empty
		role := user.Role
		if role == "" {
			role = "Team Member" // Default role if none is set
		}

		safeUsers = append(safeUsers, fiber.Map{
			"id":           user.ID,
			"nama":         user.Nama,
			"email":        user.Email,
			"role":         role,
			"bio":          user.Bio,
			"profileImage": user.ProfileImage,
		})
	}

	return c.JSON(safeUsers)
}

// CreateUser godoc
//
//	@Summary		Create a new user
//	@Description	Create a new user account with username, email and password
//	@Tags			Users
//	@Accept			json
//	@Produce		json
//	@Param			user	body		models.User			true	"User data"
//	@Success		200		{object}	map[string]interface{}	"User created successfully"
//	@Failure		400		{object}	map[string]string		"Invalid request"
//	@Failure		500		{object}	map[string]string		"Internal server error"
//	@Router			/users [post]
func CreateUser(c *fiber.Ctx) error {
	var user models.User
	if err := c.BodyParser(&user); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Gagal hash password"})
	}
	user.Password = hashedPassword

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := config.UserCollectionRef.InsertOne(ctx, user)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(200).JSON(fiber.Map{"inserted_id": result.InsertedID})
}

// Tambahkan fungsi-fungsi berikut

// GetUserById godoc
//
//	@Summary		Get user by ID
//	@Description	Get user information by user ID
//	@Tags			Users
//	@Produce		json
//	@Param			id	path		string					true	"User ID"
//	@Success		200	{object}	models.UserResponse		"User information"
//	@Failure		404	{object}	map[string]string		"User not found"
//	@Router			/users/{id} [get]
//
// GetUserById returns user information by ID
func GetUserById(c *fiber.Ctx) error {
	userID := c.Params("id")
	fmt.Println("Looking up user with ID:", userID)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	var err error

	// Coba dengan ObjectID terlebih dahulu
	objectID, objErr := primitive.ObjectIDFromHex(userID)
	if objErr == nil {
		err = config.UserCollectionRef.FindOne(ctx, bson.M{"_id": objectID}).Decode(&user)
		if err == nil {
			// User ditemukan dengan ObjectID
			userResponse := models.UserResponse{
				ID:           user.ID,
				Nama:         user.Nama,
				Email:        user.Email,
				Role:         user.Role,
				Bio:          user.Bio,
				ProfileImage: user.ProfileImage,
			}
			fmt.Println("User found with ObjectID:", userID)
			return c.JSON(userResponse)
		}
	}

	// Jika tidak ditemukan dengan ObjectID, coba dengan string ID
	err = config.UserCollectionRef.FindOne(ctx, bson.M{"_id": userID}).Decode(&user)
	if err != nil {
		fmt.Println("User not found with ID:", userID, "Error:", err)
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	// Create response without password
	userResponse := models.UserResponse{
		ID:           user.ID,
		Nama:         user.Nama,
		Email:        user.Email,
		Role:         user.Role,
		Bio:          user.Bio,
		ProfileImage: user.ProfileImage,
	}

	fmt.Println("User found with string ID:", userID)
	return c.JSON(userResponse)
}

// UploadProfileImage godoc
//
//	@Summary		Upload profile image
//	@Description	Upload a profile image for the authenticated user
//	@Tags			Users
//	@Accept			multipart/form-data
//	@Produce		json
//	@Security		Bearer
//	@Param			image	formData	file					true	"Image file"
//	@Success		200		{object}	map[string]interface{}	"Image uploaded successfully"
//	@Failure		400		{object}	map[string]string		"Invalid request"
//	@Failure		500		{object}	map[string]string		"Internal server error"
//	@Router			/api/upload-profile-image [post]
func UploadProfileImage(c *fiber.Ctx) error {
	// Get user ID from JWT token
	userClaims, ok := c.Locals("user").(jwt.MapClaims)
	if !ok {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to parse user claims"})
	}

	// Convert the ID to string safely
	userID, ok := userClaims["id"].(string)
	if !ok {
		return c.Status(500).JSON(fiber.Map{"error": "Invalid user ID in token"})
	}

	fmt.Println("Processing upload for user:", userID)

	// Get the file from request
	file, err := c.FormFile("image")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "No file provided or invalid file"})
	}

	// Create uploads directory if it doesn't exist
	uploadDir := "./uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		err = os.MkdirAll(uploadDir, 0755)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to create uploads directory"})
		}
	}

	// Generate file name with timestamp to avoid duplicates
	timeStamp := time.Now().UnixNano()
	fileName := fmt.Sprintf("%d_%s", timeStamp, file.Filename)
	filePath := fmt.Sprintf("%s/%s", uploadDir, fileName)

	// Save the file
	if err := c.SaveFile(file, filePath); err != nil {
		fmt.Println("Error saving file:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to save the file"})
	}

	// Create image URL - PENTING: path harus mulai dengan '/'
	imageURL := fmt.Sprintf("/uploads/%s", fileName)
	fmt.Println("Image saved at:", imageURL)

	// Update user profile in database
	var result *mongo.UpdateResult
	var updateErr error
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Try with ObjectID first
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err == nil {
		// Valid ObjectID
		result, updateErr = config.UserCollectionRef.UpdateOne(
			ctx,
			bson.M{"_id": objectID},
			bson.M{"$set": bson.M{"profileImage": imageURL}},
		)

		if updateErr == nil && result.MatchedCount > 0 {
			fmt.Println("Updated with ObjectID successfully:", result)
			return c.JSON(fiber.Map{
				"message":  "Image uploaded successfully",
				"imageUrl": imageURL,
			})
		}
	}

	// Fall back to string ID
	result, updateErr = config.UserCollectionRef.UpdateOne(
		ctx,
		bson.M{"_id": userID},
		bson.M{"$set": bson.M{"profileImage": imageURL}},
	)

	if updateErr != nil {
		// Clean up file on error
		os.Remove(filePath)
		fmt.Println("Error updating profile:", updateErr)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update profile"})
	}

	if result.MatchedCount == 0 {
		// No document matched, clean up file
		os.Remove(filePath)
		fmt.Println("No user found with ID:", userID)
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	fmt.Println("Update successful with string ID:", result)

	return c.JSON(fiber.Map{
		"message":  "Image uploaded successfully",
		"imageUrl": imageURL,
	})
}

// UpdateUser godoc
//
//	@Summary		Update user information
//	@Description	Update user profile information including name, email, role, bio, and password
//	@Tags			Users
//	@Accept			json
//	@Produce		json
//	@Param			id		path		string					true	"User ID"
//	@Param			user	body		object{nama=string,email=string,role=string,bio=string,profileImage=string,currentPassword=string,newPassword=string}	true	"User update data"
//	@Success		200		{object}	map[string]string		"User updated successfully"
//	@Failure		400		{object}	map[string]string		"Invalid request"
//	@Failure		404		{object}	map[string]string		"User not found"
//	@Failure		500		{object}	map[string]string		"Internal server error"
//	@Router			/api/users/{id} [put]
//
// UpdateUser function
func UpdateUser(c *fiber.Ctx) error {
	userID := c.Params("id")
	fmt.Println("Updating user with ID:", userID)

	var updateData struct {
		Nama            string `json:"nama"`
		Email           string `json:"email"`
		Role            string `json:"role"`
		Bio             string `json:"bio"`
		ProfileImage    string `json:"profileImage"`
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}

	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
	}

	fmt.Printf("Update data: %+v\n", updateData)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	update := bson.M{}

	if updateData.Nama != "" {
		update["nama"] = updateData.Nama
	}

	if updateData.Email != "" {
		update["email"] = updateData.Email
	}

	if updateData.Role != "" {
		update["role"] = updateData.Role
	}

	if updateData.Bio != "" {
		update["bio"] = updateData.Bio
	}

	if updateData.ProfileImage != "" {
		update["profileImage"] = updateData.ProfileImage
	}

	if updateData.NewPassword != "" && updateData.CurrentPassword != "" {
		// Validasi current password sebelum update
		var user models.User

		// Coba dengan ObjectID
		objectID, err := primitive.ObjectIDFromHex(userID)
		if err == nil {
			err = config.UserCollectionRef.FindOne(ctx, bson.M{"_id": objectID}).Decode(&user)
		}

		// Jika tidak berhasil, coba dengan string ID
		if err != nil {
			err = config.UserCollectionRef.FindOne(ctx, bson.M{"_id": userID}).Decode(&user)
		}

		if err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "User not found"})
		}

		// Verify current password
		if !utils.ComparePasswords(user.Password, updateData.CurrentPassword) {
			return c.Status(400).JSON(fiber.Map{"error": "Current password is incorrect"})
		}

		// Hash new password
		hashedPassword, err := utils.HashPassword(updateData.NewPassword)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to hash new password"})
		}

		update["password"] = hashedPassword
	}

	if len(update) == 0 {
		return c.Status(400).JSON(fiber.Map{"error": "No fields to update"})
	}

	// Coba update dengan ObjectID
	var err error

	objectID, err := primitive.ObjectIDFromHex(userID)
	if err == nil {
		updateResult, err := config.UserCollectionRef.UpdateOne(
			ctx,
			bson.M{"_id": objectID},
			bson.M{"$set": update},
		)

		if err == nil && updateResult.MatchedCount > 0 {
			fmt.Println("Updated with ObjectID successfully")
			return c.Status(200).JSON(fiber.Map{"message": "User updated successfully"})
		}
	}

	// Jika gagal dengan ObjectID, coba dengan string ID
	updateResult, err := config.UserCollectionRef.UpdateOne(
		ctx,
		bson.M{"_id": userID},
		bson.M{"$set": update},
	)

	if err != nil {
		fmt.Println("Error updating user:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update user"})
	}

	if updateResult.MatchedCount == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	fmt.Println("Updated with string ID successfully")
	return c.Status(200).JSON(fiber.Map{"message": "User updated successfully"})
}

// DeleteUser godoc
//
//	@Summary		Delete user
//	@Description	Delete a user account by user ID
//	@Tags			Users
//	@Produce		json
//	@Security		Bearer
//	@Param			id	path		string				true	"User ID"
//	@Success		200	{object}	map[string]string	"User deleted successfully"
//	@Failure		400	{object}	map[string]string	"Bad request - Cannot delete self"
//	@Failure		403	{object}	map[string]string	"Forbidden - Admin role required"
//	@Failure		404	{object}	map[string]string	"User not found"
//	@Failure		500	{object}	map[string]string	"Internal server error"
//	@Router			/api/users/{id} [delete]
func DeleteUser(c *fiber.Ctx) error {
	// Get token user information
	userClaims, ok := c.Locals("user").(jwt.MapClaims)
	if !ok {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to parse user claims"})
	}

	// Get admin user's ID
	adminID, ok := userClaims["id"].(string)
	if !ok {
		return c.Status(500).JSON(fiber.Map{"error": "Invalid user ID in token"})
	}

	// Get admin user's role from database to verify they're admin
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var adminUser models.User

	// Try getting admin user with ObjectID first
	adminObjectID, err := primitive.ObjectIDFromHex(adminID)
	if err == nil {
		err = config.UserCollectionRef.FindOne(ctx, bson.M{"_id": adminObjectID}).Decode(&adminUser)
		if err != nil {
			// Try with string ID
			err = config.UserCollectionRef.FindOne(ctx, bson.M{"_id": adminID}).Decode(&adminUser)
		}
	} else {
		// Try with string ID
		err = config.UserCollectionRef.FindOne(ctx, bson.M{"_id": adminID}).Decode(&adminUser)
	}

	if err != nil {
		fmt.Println("Error finding admin user:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to verify admin credentials"})
	}

	// Check if user is admin
	if adminUser.Role != "Admin" {
		fmt.Println("User tried to delete but doesn't have admin role:", adminUser.Role)
		return c.Status(403).JSON(fiber.Map{"error": "Admin role required to delete users"})
	}

	// Get target user ID to delete
	userID := c.Params("id")
	fmt.Println("Attempting to delete user with ID:", userID)

	// Prevent admin from deleting themselves
	if userID == adminID {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot delete your own account"})
	}

	var deleteResult *mongo.DeleteResult

	// Try with ObjectID first
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err == nil {
		deleteResult, err = config.UserCollectionRef.DeleteOne(ctx, bson.M{"_id": objectID})
		if err == nil && deleteResult.DeletedCount > 0 {
			fmt.Println("Deleted user with ObjectID successfully")
			return c.JSON(fiber.Map{"message": "User deleted successfully"})
		}
	}

	// Fall back to string ID
	deleteResult, err = config.UserCollectionRef.DeleteOne(ctx, bson.M{"_id": userID})
	if err != nil {
		fmt.Println("Error deleting user:", err)
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete user"})
	}

	if deleteResult.DeletedCount == 0 {
		fmt.Println("No user found with ID:", userID)
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	fmt.Println("Deleted user with string ID successfully")
	return c.JSON(fiber.Map{"message": "User deleted successfully"})
}
