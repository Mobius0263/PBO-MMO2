package main

import (
	"log"
	"os"

	"backend/config"
	"backend/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️ No .env file found, using environment variables")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Check if JWT_SECRET is set
	if os.Getenv("JWT_SECRET") == "" {
		log.Println("⚠️ JWT_SECRET not set in environment variables, using default (insecure for production)")
	}

	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			// Log error secara detail
			log.Printf("❌ ERROR: %v\nPath: %s, Method: %s", err, c.Path(), c.Method())

			// Return error response
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}

			return c.Status(code).JSON(fiber.Map{
				"error":  err.Error(),
				"path":   c.Path(),
				"method": c.Method(),
			})
		},
	})

	// Konfigurasi CORS yang benar
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173", // Mengizinkan semua asal
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowCredentials: true,
		ExposeHeaders:    "Content-Length, Content-Disposition",
	}))

	// Add Logger middleware
	app.Use(logger.New())

	// Serve static files
	app.Static("/uploads", "./uploads")

	// Connect to database
	config.ConnectDB()
	log.Println("✅ Connected to database")

	// Setup routes
	routes.SetupRoutes(app)

	// PERBAIKAN: hanya satu app.Listen yang dijalankan
	log.Printf("🚀 Server running at http://localhost:%s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatal("❌ Failed to start server:", err)
	}
}
