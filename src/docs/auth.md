# Hotel Management System - Authentication Module Documentation

This document outlines the architecture, implementation details, and API endpoints for the **Authentication Module** in the Hotel Management System. The module is built using a stateless architecture leveraging **Passport.js (Google OAuth 2.0)** and **JSON Web Tokens (JWT)**.

---

## 1. Architecture & Security Decisions

- **Stateless Authentication:** `express-session` has been completely removed. Sessions are disabled (`session: false`) across all Passport configurations to enforce a purely stateless REST API design using JWT.
- **Centralized Error Handling:** All errors throw custom `AppError` instances handled uniformly by custom error-handling middleware, ensuring strict compliance with the project's API Response Contract.
- **Defensive Programming in Services:** 
  - Email presence verification is strictly enforced during Google account parsing.
  - User names fetched from Google profiles are safely truncated (`maxlength: 40`) to prevent database schema validation crashes.

---

## 2. Authentication Flow

1. **Initiate Login:** The client directs the user to the Google OAuth consent screen.
2. **Google Callback:** Google redirects the user back to the backend with an authorization code.
3. **Strategy Validation:** Passport validates the token, extracts user profile information, and triggers the `findOrCreateGoogleUser` service:
   - If the user exists via `googleId`, they are retrieved.
   - If not, a new user record is provisioned in MongoDB with the `GUEST` role by default.
4. **Token Generation:** Upon successful authentication, a signed JWT containing the user's `id` and `role` is generated and returned alongside user details inside the standardized success envelope.
5. **Failure Handling:** If authentication is cancelled or fails, requests are redirected to a dedicated `/login-failed` endpoint that returns a standardized `401 Unauthorized` JSON error.

---

## 3. API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/auth/google` | Initiates the Google OAuth2 authentication flow. |
| `GET` | `/api/v1/auth/google/callback` | Handles the Google redirect, processes user creation/lookup, and returns the JWT token. |
| `GET` | `/api/v1/auth/login-failed` | Returns a standardized `401` error response if Google authentication fails or is cancelled. |

---

## 4. Response Contracts

### Success Response Example (`200 OK`)
```json
{
  "data": {
    "message": "Logged in successfully",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVC...",
    "user": {
      "id": "66a1b2c3d4e5f67890123456",
      "userName": "Mostafa Khaled",
      "email": "mostafa@example.com",
      "role": "guest",
      "profileImage": "[https://lh3.googleusercontent.com/](https://lh3.googleusercontent.com/)...",
      "phone": ""
    }
  }
}
```

---

## 5. Response Contracts With Error

### Error Response Example (`401 UNAUTHORIZED`)
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Google authentication failed or was cancelled.",
    "details": []
  }
}
```

---

### Next Phase: Authentication & Authorization

- #### Implement `authenticate` (Protect) Middleware:
  - Extract and parse `Authorization: Bearer <token>` header.
  - Verify JWT payload integrity using `jsonwebtoken.verify`.
  - Fetch user from database using `findUserById` to ensure active status.
  - Attach authenticated user object to `req.user`.
- #### Implement `authorize(...roles)` Middleware:
  - Restrict access to endpoints based on user roles (`ADMIN`, `GUEST`, etc.).
  - Handle unauthorized access states using custom `AppError`.