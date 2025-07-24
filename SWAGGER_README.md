# API Documentation with Swagger

This application now includes comprehensive API documentation using Swagger/OpenAPI.

## Accessing Swagger Documentation

Once the backend server is running, you can access the interactive API documentation at:

```
http://localhost:8080/swagger/index.html
```

## What's Included

The Swagger documentation provides:

### 📋 **API Overview**
- **Title**: CoEmotion API
- **Version**: 1.0
- **Description**: Meeting management system API
- **Base URL**: `http://localhost:8080`

### 🔐 **Authentication**
- **Type**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <your_jwt_token>`

### 📚 **API Endpoints Documentation**

#### **Authentication Endpoints**
- `POST /login` - User login
- `POST /register` - User registration

#### **User Management Endpoints**
- `GET /users` - Get all users (public)
- `GET /api/users` - Get all users (protected)
- `GET /api/team-members` - Get team members (protected)
- `GET /api/users/{id}` - Get user by ID (protected)
- `PUT /api/users/{id}` - Update user (protected)

#### **Meeting Management Endpoints**
- `POST /api/meetings` - Create new meeting (protected)
- `GET /api/meetings` - Get all meetings (protected)
- `GET /api/meetings/today` - Get today's meetings (protected)

### 🚀 **Features**

1. **Interactive Testing**: Test APIs directly from the browser
2. **Request/Response Examples**: See example payloads and responses
3. **Model Definitions**: View data structure schemas
4. **Authentication Testing**: Test protected endpoints with JWT tokens
5. **Response Codes**: See all possible HTTP status codes for each endpoint

## How to Use

### 1. **Testing Authentication**
1. Go to `/login` endpoint in Swagger
2. Click "Try it out"
3. Enter your credentials:
   ```json
   {
     "email": "your_email@example.com",
     "password": "your_password"
   }
   ```
4. Copy the JWT token from the response

### 2. **Testing Protected Endpoints**
1. Click the "Authorize" button (🔒) at the top of the Swagger page
2. Enter: `Bearer <your_jwt_token>`
3. Click "Authorize"
4. Now you can test all protected endpoints

### 3. **Model Schemas**
- Scroll down to see all data models (User, Meeting, etc.)
- Click on models to see their structure and required fields

## Regenerating Documentation

If you add new endpoints or modify existing ones:

1. Add Swagger annotations to your controllers
2. Run the generation command:
   ```bash
   cd backend
   go run github.com/swaggo/swag/cmd/swag init
   ```
3. Restart the backend server

## Swagger Annotations Reference

### Basic Endpoint Annotation
```go
// FunctionName godoc
// @Summary Brief description
// @Description Detailed description
// @Tags TagName
// @Accept json
// @Produce json
// @Param paramName body/query/path Type true "Description"
// @Success 200 {object} ReturnType "Success description"
// @Failure 400 {object} ErrorType "Error description"
// @Router /endpoint [method]
// @Security Bearer
func FunctionName(c *fiber.Ctx) error {
    // function implementation
}
```

### Security for Protected Endpoints
Add `@Security Bearer` to endpoints that require authentication.

## Dependencies Added

The following Go packages were added for Swagger support:

```go
github.com/swaggo/swag/cmd/swag         // Swagger code generator
github.com/gofiber/swagger              // Fiber Swagger middleware
github.com/swaggo/fiber-swagger         // Fiber-specific Swagger integration
```

---

**Note**: The Swagger documentation is automatically generated from code annotations and provides a complete, interactive API reference for developers and API consumers.
