package controllers

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"

	"backend/config"
	"backend/models"
	"backend/utils"
)

func Register(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user models.User
	if err := c.BodyParser(&user); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Request tidak valid"})
	}

	// Check if email already exists
	var existingUser models.User
	err := config.UserCollectionRef.FindOne(ctx, bson.M{"email": user.Email}).Decode(&existingUser)
	if err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Email sudah terdaftar"})
	}

	// Hash password using our utility function
	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal hash password"})
	}
	user.Password = hashedPassword

	_, err = config.UserCollectionRef.InsertOne(ctx, user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal menyimpan user"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Registrasi berhasil",
		"user": fiber.Map{
			"nama":  user.Nama,
			"email": user.Email,
		},
	})
}

func Login(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.BodyParser(&input); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Request tidak valid"})
	}

	var user models.User
	err := config.UserCollectionRef.FindOne(ctx, bson.M{"email": input.Email}).Decode(&user)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Email tidak ditemukan"})
	}

	// Check password using our utility function
	if !utils.CheckPasswordHash(input.Password, user.Password) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Password salah"})
	}

	// Generate JWT using our utility function
	tokenString, err := utils.GenerateJWT(user.ID, user.Email, user.Nama)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Gagal membuat token"})
	}

	return c.JSON(fiber.Map{
        "message": "Login berhasil",
        "token":   tokenString,
        "user": fiber.Map{
            "id":    user.ID, // Pastikan field ini ada
            "nama":  user.Nama,
            "email": user.Email,
            "role":  user.Role,
            "profileImage": user.ProfileImage,
        },
    })
}
