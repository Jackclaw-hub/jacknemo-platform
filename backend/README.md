# Startup Radar Backend - JWT Authentication System

## Overview
Complete JWT-based authentication system for Startup Radar platform with support for 4 user roles:
- **founder**: Early-stage startup founders
- **equipment_provider**: Hubs and equipment providers  
- **service_provider**: Agencies and service providers
- **admin**: Platform administrators

## API Endpoints

### Authentication Routes (`/api/auth`)

#### POST `/api/auth/register`
Register a new user

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "role": "founder",
  "name": "Optional Name"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "founder",
      "name": "Optional Name"
    },
    "token": "jwt.token.here"
  }
}
```

#### POST `/api/auth/login`
User login

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "founder",
      "name": "Optional Name"
    },
    "token": "jwt.token.here"
  }
}
```

#### GET `/api/auth/profile`
Get user profile (protected)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "data": {
    "id": 1,
    "email": "user@example.com",
    "role": "founder",
    "name": "Optional Name",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### PUT `/api/auth/profile`
Update user profile (protected)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "data": {
    "id": 1,
    "email": "newemail@example.com",
    "role": "founder",
    "name": "Updated Name",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## Database Setup

### 1. Create Database
```bash
createdb startup_radar
```

### 2. Run Schema
```bash
psql -d startup_radar -f database/schema.sql
```

### 3. Seed Data (Optional)
```bash
psql -d startup_radar -f database/seed.sql
```

## Environment Variables

Create a `.env` file in the backend root:

```env
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=startup_radar
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_EXPIRE=24h

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Security Features

- **Password Hashing**: Uses bcrypt with salt rounds 10
- **JWT Tokens**: Secure token-based authentication
- **Role Validation**: Ensures users have proper permissions
- **Input Validation**: Validates email format and role types
- **SQL Injection Protection**: Uses parameterized queries

## Running the Server

```bash
# Install dependencies
npm install

# Development mode with auto-restart
npm run dev

# Production mode
npm start

# Run tests
npm test
```

## Testing

Test endpoints using curl or Postman:

```bash
# Register a user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123", "role": "founder"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'

# Get profile (replace with actual token)
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer your.jwt.token.here"
```