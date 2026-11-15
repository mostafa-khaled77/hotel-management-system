# Users Module API

This document describes the current implementation in `src/routes/user.js`,
`src/controllers/userController.js`, `src/services/user.service.js`, and
`src/models/user.model.js`. The route prefix is `/api/v1/users`.

## Access and routes

| Method | Endpoint | Access | Behavior |
| --- | --- | --- | --- |
| `GET` | `/api/v1/users/me` | Authenticated user | Returns the current user's profile. |
| `PATCH` | `/api/v1/users/updateUser` | Authenticated user | Updates the current user's editable profile fields. |
| `GET` | `/api/v1/users` | Admin only | Lists users with pagination. |
| `GET` | `/api/v1/users/:id` | Admin only | Returns one user by ID. |
| `DELETE` | `/api/v1/users/:id` | The account owner or an admin | Deletes the specified user. |
| `PATCH` | `/api/v1/users/:id/role` | Admin only | Changes the specified user's role. |

`verifyToken` requires a valid JWT. It accepts `Authorization: Bearer <token>`
or the `token` cookie and assigns the decoded payload to `req.user`.
`verifyTokenAndAdmin` additionally requires `req.user.role === 'admin'`.
`verifyTokenAndAuthorization` allows deletion when the authenticated user's
ID matches `:id` or the user's role is `admin`.

The users router does not attach `validateObjectId` to its `:id` routes. Invalid
IDs are not rejected by a dedicated route middleware. Mongoose cast errors go
to the application error handler, which responds with its generic
`500 Internal Server Error` fallback for errors without an explicit status.

## User schema

| Field | Mongoose type | Required | Constraints | Default |
| --- | --- | --- | --- | --- |
| `googleId` | `String` | Yes | Unique | — |
| `userName` | `String` | Yes | Trimmed; minimum length `2`; maximum length `40` | — |
| `email` | `String` | Yes | Lowercase, trimmed, unique | — |
| `profileImage` | `String` | No | Trimmed | `''` |
| `phone` | `String` | No | Trimmed | `''` |
| `role` | `String` | No | Enum: `admin`, `user` | `user` |

Mongoose timestamps add `createdAt` and `updatedAt`. The JSON transform exposes
the MongoDB `_id` as `id` and removes `_id` and `__v`.

### Joi validation for profile updates

`PATCH /api/v1/users/updateUser` validates the request body with Joi. At least
one field is required; unknown fields are rejected.

| Field | Joi rule |
| --- | --- |
| `userName` | String, trimmed, length `2`–`40` |
| `profileImage` | String, trimmed; empty string allowed |
| `phone` | String, trimmed; empty string allowed |

The profile update endpoint does not permit changing `role`, `googleId`, or
`email`. The role endpoint does not use a Joi schema; it updates `role` using
Mongoose validators, which enforce the schema enum.

## Endpoint details

### Get current user

`GET /api/v1/users/me` — **Authenticated user**

Looks up the user by the ID in the JWT. The returned document excludes `role`.

- `200 OK`: user returned in `data`.
- `401 Unauthorized`: token missing or invalid.
- `404 Not Found`: authenticated ID does not match an existing user.

### Update current user's profile

`PATCH /api/v1/users/updateUser` — **Authenticated user**

Updates the authenticated user's `userName`, `profileImage`, and/or `phone`.
The request body follows the Joi rules above. The returned user excludes `role`.

- `200 OK`: updated user returned in `data`.
- `400 Bad Request`: invalid or empty body.
- `401 Unauthorized`: token missing or invalid.
- `404 Not Found`: authenticated ID does not match an existing user.

### List users

`GET /api/v1/users` — **Admin only**

Query parameters:

| Parameter | Type and behavior |
| --- | --- |
| `page` | Positive integer; defaults to `1`. |
| `limit` | Positive integer; defaults to `20`; values above `100` are capped at `100`. |

The result excludes each user's `role`. The response follows the standard
pagination contract: `data` is the user array and `pagination` is a sibling
property.

**`200 OK`**

```json
{
  "data": [
    {
      "id": "66a1b2c3d4e5f67890123456",
      "googleId": "google-user-id",
      "userName": "Example User",
      "email": "user@example.com",
      "profileImage": "",
      "phone": "",
      "createdAt": "2026-10-04T01:00:00.000Z",
      "updatedAt": "2026-10-04T01:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

- `400 Bad Request`: invalid `page` or `limit`.
- `401 Unauthorized`: token missing or invalid.
- `403 Forbidden`: caller is not an admin.

### Get user by ID

`GET /api/v1/users/:id` — **Admin only**

Returns the user document in `data` (including `role`).

- `200 OK`: user found.
- `401 Unauthorized`: token missing or invalid.
- `403 Forbidden`: caller is not an admin.
- `404 Not Found`: no user matches the ID.

### Delete user

`DELETE /api/v1/users/:id` — **Account owner or admin**

- `204 No Content`: user deleted; response has no body.
- `401 Unauthorized`: token missing or invalid.
- `403 Forbidden`: caller is neither the account owner nor an admin.
- `404 Not Found`: no user matches the ID.

### Update user role

`PATCH /api/v1/users/:id/role` — **Admin only**

Request body:

```json
{
  "role": "admin"
}
```

Allowed role values are `admin` and `user`. Mongoose's update validators enforce
the role enum. Success returns the updated user in `data`.

- `200 OK`: role updated.
- `401 Unauthorized`: token missing or invalid.
- `403 Forbidden`: caller is not an admin.
- `404 Not Found`: no user matches the ID.
- A value outside the role enum fails Mongoose validation and is handled by the
  generic error middleware; the current code does not convert this validation
  error to a `400` response.

## Response and error envelopes

Success responses use `{ "data": ... }`. List responses include a sibling
`pagination` property. Delete success returns no body.

Errors use this shape:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "User Not Found",
    "details": []
  }
}
```
