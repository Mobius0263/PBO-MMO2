package routes

import (
	"backend/controllers"
	"backend/middleware"

	"github.com/gofiber/fiber/v2"
	fiberSwagger "github.com/swaggo/fiber-swagger"
)

func SetupRoutes(app *fiber.App) {
	// TAMBAHKAN: Route untuk debugging di root
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("API Server is running")
	})

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

	// Protected Api routes
	api := app.Group("/api")
	api.Use(middleware.Protected())

	// Protected User endpoints dalam group /api
	api.Get("/users", controllers.GetUsers)
	api.Get("/team-members", controllers.GetTeamMembers)
	api.Get("/users/:id", controllers.GetUserById)
	api.Put("/users/:id", controllers.UpdateUser)

	// Upload profile image
	api.Post("/upload-profile-image", controllers.UploadProfileImage)

	// Meeting routes - using the existing protected API group
	api.Post("/meetings", controllers.CreateMeeting)
	api.Get("/meetings", controllers.GetMeetings)
	api.Get("/meetings/today", controllers.GetTodayMeetings)
	api.Get("/meetings/upcoming", controllers.GetUpcomingMeetings)

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.Status(200).JSON(fiber.Map{
			"status":  "ok",
			"message": "Server is running",
		})
	})
}
