package routes

import (
	"time"

	"backend/controllers"
	"backend/middleware"

	"github.com/gofiber/fiber/v2"
	fiberSwagger "github.com/swaggo/fiber-swagger"
)

func SetupRoutes(app *fiber.App) {
	// Root endpoint
	app.Get("/", RootHandler)

	// Swagger documentation route
	app.Get("/swagger/*", fiberSwagger.WrapHandler)

	// Auth routes - di kedua lokasi untuk kompatibilitas
	// 1. Tanpa prefix /auth untuk frontend lama
	app.Post("/login", controllers.Login)
	app.Post("/register", controllers.Register)

	// 2. Dengan prefix /auth untuk frontend baru
	auth := app.Group("/auth")
	auth.Post("/login", controllers.Login)
	auth.Post("/register", controllers.Register)

	// TAMBAHKAN: Non-protected User endpoint
	app.Get("/users", controllers.GetUsers)
	app.Get("/users/:id", controllers.GetUserById)
	app.Post("/users", controllers.CreateUser)

	// Protected Api routes
	api := app.Group("/api")
	api.Use(middleware.Protected())

	// Protected User endpoints dalam group /api
	api.Get("/users", controllers.GetUsers)
	api.Get("/team-members", controllers.GetTeamMembers)
	api.Get("/users/:id", controllers.GetUserById)
	api.Put("/users/:id", controllers.UpdateUser)
	api.Delete("/users/:id", controllers.DeleteUser)

	// Upload profile image
	api.Post("/upload-profile-image", controllers.UploadProfileImage)

	// Meeting routes - using the existing protected API group
	api.Post("/meetings", controllers.CreateMeeting)
	api.Get("/meetings", controllers.GetMeetings)
	api.Get("/meetings/today", controllers.GetTodayMeetings)
	api.Get("/meetings/upcoming", controllers.GetUpcomingMeetings)
	api.Get("/meetings/:id", controllers.GetMeetingById)
	api.Put("/meetings/:id", controllers.UpdateMeeting)
	api.Delete("/meetings/:id", controllers.DeleteMeeting)

	// Health check
	app.Get("/health", HealthCheck)
}

// RootHandler godoc
//
//	@Summary		API Root
//	@Description	API server status and information
//	@Tags			General
//	@Produce		json
//	@Success		200	{object}	map[string]interface{}	"API server information"
//	@Router			/ [get]
func RootHandler(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"message": "CoEmotion API Server is running",
		"version": "1.0",
		"docs":    "/swagger/index.html",
		"status":  "active",
	})
}

// HealthCheck godoc
//
//	@Summary		Health check
//	@Description	Check if the server is running and healthy
//	@Tags			Health
//	@Produce		json
//	@Success		200	{object}	map[string]interface{}	"Server is healthy"
//	@Router			/health [get]
func HealthCheck(c *fiber.Ctx) error {
	return c.Status(200).JSON(fiber.Map{
		"status":  "ok",
		"message": "Server is running",
		"time":    time.Now().Format(time.RFC3339),
	})
}
