# Hotel Rooms Module API

This document describes the room endpoints as currently implemented by
`src/routes/room.js`, `src/controllers/roomController.js`, and
`src/models/room.model.js`.

## Base path

`/api/v1/rooms`

## Access and endpoints

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/v1/rooms` | Public | Lists rooms in ascending `roomNumber` order. |
| `GET` | `/api/v1/rooms/:id` | Public | Gets one room by MongoDB ObjectId. |
| `POST` | `/api/v1/rooms` | Private — Admin only | Creates a room after Joi validation. |
| `PATCH` | `/api/v1/rooms/:id` | Private — Admin only | Updates one or more room fields after Joi validation. |
| `DELETE` | `/api/v1/rooms/:id` | Private — Admin only | Deletes a room. |

The write routes use `verifyTokenAndAdmin`. Send a valid JWT using
`Authorization: Bearer <token>` or the `token` cookie. The decoded user's role
must be `admin`. A missing or invalid token returns `401 Unauthorized`; an
authenticated non-admin receives `403 Forbidden`.

For routes containing `:id`, `validateObjectId` runs before the route handler.
An invalid MongoDB ObjectId returns `400 Bad Request`.

## Room schema

The Mongoose `Room` schema defines these fields:

| Field | Mongoose type | Required | Mongoose constraints | Default |
| --- | --- | --- | --- | --- |
| `roomType` | `String` | Yes | Enum: `Single`, `Double` | — |
| `roomNumber` | `Number` | Yes | Minimum `1`; unique | — |
| `price` | `Number` | Yes | Minimum `0` | — |
| `capacity` | `Number` | Yes | Minimum `1` | — |
| `floor` | `Number` | No | None | — |
| `description` | `String` | No | Trimmed | — |
| `isAvailable` | `Boolean` | No | None | `true` |

Mongoose timestamps add `createdAt` and `updatedAt`. The model's JSON
transformation exposes `_id` as the string `id` and removes `_id` and `__v`.

## Joi validation

Joi validates request bodies in the create and update handlers. In addition
to these rules, Joi's object schema rejects unknown fields.

| Field | Create (`POST`) | Update (`PATCH`) |
| --- | --- | --- |
| `roomType` | Required string; `Single` or `Double` | Optional string; `Single` or `Double` |
| `roomNumber` | Required integer; minimum `1` | Optional integer; minimum `1` |
| `price` | Required number; minimum `0` | Optional number; minimum `0` |
| `capacity` | Required integer; minimum `1` | Optional integer; minimum `1` |
| `floor` | Optional integer | Optional integer |
| `description` | Required string | Optional string |
| `isAvailable` | Optional boolean | Optional boolean |

The update body must contain at least one recognized field. Notably,
`description` is optional in the Mongoose schema but required by Joi for room
creation. `roomNumber` uniqueness is enforced by MongoDB's unique index rather
than by a Joi validation rule.

## Endpoint details

### List rooms

`GET /api/v1/rooms` — **Public**

Supported query parameters:

| Parameter | Type and behavior |
| --- | --- |
| `page` | Positive integer; defaults to `1`. |
| `limit` | Positive integer; defaults to `20`; values above `100` are capped at `100`. |

The results are sorted by `roomNumber` ascending. No filters or client-selected
sort options are implemented.

**Success — `200 OK`**

```json
{
  "data": [
    {
      "id": "66a1b2c3d4e5f67890123456",
      "roomType": "Double",
      "roomNumber": 204,
      "price": 150,
      "capacity": 2,
      "floor": 2,
      "description": "City view",
      "isAvailable": true,
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

Invalid `page` or `limit` values return `400 Bad Request`.

### Get a room

`GET /api/v1/rooms/:id` — **Public**

Returns the matching room in the `data` response envelope.

- `200 OK`: room found.
- `400 Bad Request`: `:id` is not a valid MongoDB ObjectId.
- `404 Not Found`: no room matches the valid ID.

### Create a room

`POST /api/v1/rooms` — **Private (Admin only)**

Example request body:

```json
{
  "roomType": "Single",
  "roomNumber": 105,
  "price": 90,
  "capacity": 1,
  "floor": 1,
  "description": "Quiet room",
  "isAvailable": true
}
```

The request body follows the create Joi rules above.

- `201 Created`: room created; response contains the room in `data`.
- `400 Bad Request`: Joi validation failed.
- `401 Unauthorized`: JWT is missing or invalid.
- `403 Forbidden`: caller is not an admin.
- `409 Conflict`: `roomNumber` conflicts with an existing room.

### Update a room

`PATCH /api/v1/rooms/:id` — **Private (Admin only)**

Send one or more allowed fields in the request body. The fields provided are
validated using the update Joi rules above, and the response contains the
updated room in `data`.

- `200 OK`: room updated.
- `400 Bad Request`: invalid ObjectId or Joi validation failed.
- `401 Unauthorized`: JWT is missing or invalid.
- `403 Forbidden`: caller is not an admin.
- `404 Not Found`: no room matches the valid ID.
- `409 Conflict`: updated `roomNumber` conflicts with another room.

### Delete a room

`DELETE /api/v1/rooms/:id` — **Private (Admin only)**

- `204 No Content`: room deleted; response has no body.
- `400 Bad Request`: `:id` is not a valid MongoDB ObjectId.
- `401 Unauthorized`: JWT is missing or invalid.
- `403 Forbidden`: caller is not an admin.
- `404 Not Found`: no room matches the valid ID.

## Error response shape

Errors use the application's standard envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation Failed !",
    "details": [
      {
        "field": "roomType",
        "message": "\"roomType\" must be one of [Single, Double]"
      }
    ]
  }
}
```
