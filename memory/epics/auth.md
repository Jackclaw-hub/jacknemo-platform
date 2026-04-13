# Auth Epic - JWT Authentication System

## Description
Implement a complete JWT-based authentication system for the Startup Radar platform.

## Tasks

### 1. Register User
- Implement user registration endpoint (`/api/auth/register`) with email, password, and role validation.
- Use bcrypt for secure password hashing.
- Return a JWT token upon successful registration.

### 2. Login User
- Implement user login endpoint (`/api/auth/login`) with email and password validation.
- Verify password using bcrypt.
- Return a JWT token upon successful login.

### 3. Get User Profile
- Implement protected endpoint (`/api/auth/profile`) to retrieve user profile information.
- Validate JWT token for authentication.

### 4. Update User Profile
- Implement protected endpoint (`/api/auth/profile`) to update user profile information.
- Validate JWT token for authentication.

## Acceptance Criteria

- User registration with role validation
- Secure password hashing (bcrypt)
- JWT token generation and validation
- Protected route authentication
- Profile management with role-based access

## Notes

- Use environment variables for sensitive data (e.g., JWT secret key).
- Implement input validation and error handling.
- Use a secure method for storing passwords (e.g., bcrypt).
- Implement authentication and authorization for protected routes.

## Status

- [ ] Not started
- [ ] In progress
- [x] Done ✅

## Assigned to

- Jack