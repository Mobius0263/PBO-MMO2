package middleware

import (
	"backend/utils"
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// Protected middleware untuk routes yang memerlukan autentikasi
func Protected() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get authorization header
		authHeader := c.Get("Authorization")

		// Debug authorization header
		fmt.Println("Auth header received:", authHeader)

		// Cek apakah header authorization ada dan formatnya benar
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Unauthorized - Missing or invalid token format",
			})
		}

		// Extract token
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// Parse dan validasi token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Validasi signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return utils.GetJWTSecret(), nil
		})

		if err != nil {
			fmt.Println("Token validation error:", err)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Unauthorized - Invalid or expired token",
			})
		}

		// Validasi token dan extract claims
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			// Set user info in context untuk route handlers
			c.Locals("user", claims)
			fmt.Println("User authenticated with ID:", claims["id"])
			return c.Next()
		}

		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Unauthorized - Invalid token claims",
		})
	}
}
