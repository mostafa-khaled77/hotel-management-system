# Room API Contract

This contract is based on the Mongoose `Room` schema in
[`src/models/room.model.js`](../models/room.model.js). The routes and response
conventions below are proposed; the current Express app does not yet register
room routes or define API-wide response conventions.

## Endpoint index

- [List rooms](#list-rooms) — `GET /api/v1/rooms`
- [Create a room](#create-a-room) — `POST /api/v1/rooms`
- [Get a room](#get-a-room) — `GET /api/v1/rooms/:id`
- [Update a room](#update-a-room) — `PATCH /api/v1/rooms/:id`
- [Delete a room](#delete-a-room) — `DELETE /api/v1/rooms/:id`

## Base URL

`/api/v1/rooms`

## Room object

Example response object:

```json
{
  "id": "66a1b2c3d4e5f67890123456",
  "type": "Double",
  "roomNumber": 204,
  "price": 150,
  "capacity": 2,
  "floor": 2,
  "description": "City view",
  "isAvailable": true,
  "createdAt": "2026-10-04T01:00:00.000Z",
  "updatedAt": "2026-10-04T01:00:00.000Z"
}
```

`id` is the MongoDB document ID serialized in place of `_id`. `createdAt` and
`updatedAt` are set by Mongoose timestamps. Clients must not send `id`, `_id`,
`createdAt`, or `updatedAt` in create or update bodies.

| Field | Rules |
| --- | --- |
| `type` | Required; `Single` or `Double`. |
| `roomNumber` | Required number; unique across rooms. |
| `price` | Required number; must be greater than or equal to `0`. |
| `capacity` | Required number; must be at least `1`. |
| `floor` | Optional number; no additional schema constraint. |
| `description` | Optional string; trimmed by the model. |
| `isAvailable` | Optional boolean; defaults to `true` on creation. |

## Endpoints

### List rooms

`GET /api/v1/rooms`

Optional query parameters can be combined:

```json
{
  "type": "Double",
  "capacity": 2,
  "floor": 2,
  "minPrice": 100,
  "maxPrice": 200,
  "isAvailable": true,
  "page": 1,
  "limit": 20,
  "sort": "roomNumber"
}
```

- `type`: exact match; `Single` or `Double`.
- `capacity`, `floor`: exact numeric matches.
- `minPrice`, `maxPrice`: inclusive price bounds.
- `isAvailable`: exact boolean match (`true` or `false`).
- `page`: 1-based page number; defaults to `1`.
- `limit`: results per page; defaults to `20`, maximum `100`.
- `sort`: comma-separated fields from `roomNumber`, `price`, `capacity`,
  `floor`, and `createdAt`; prefix a field with `-` for descending order.
  Defaults to `roomNumber`.

Example request: `GET /api/v1/rooms?type=Double&minPrice=100&isAvailable=true&page=1&limit=20`

`200 OK` response:

```json
{
  "data": [
    {
      "id": "66a1b2c3d4e5f67890123456",
      "type": "Double",
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

### Create a room

`POST /api/v1/rooms`

Request body:

```json
{
  "type": "Single",
  "roomNumber": 105,
  "price": 90,
  "capacity": 1,
  "floor": 1,
  "description": "Quiet room near the elevator",
  "isAvailable": true
}
```

`type`, `roomNumber`, `price`, and `capacity` are required. `floor`,
`description`, and `isAvailable` are optional. If omitted, `isAvailable` defaults
to `true`.

`201 Created` response:

```json
{
  "data": {
    "id": "66a1b2c3d4e5f67890123456",
    "type": "Single",
    "roomNumber": 105,
    "price": 90,
    "capacity": 1,
    "floor": 1,
    "description": "Quiet room near the elevator",
    "isAvailable": true,
    "createdAt": "2026-10-04T01:00:00.000Z",
    "updatedAt": "2026-10-04T01:00:00.000Z"
  }
}
```

### Get a room

`GET /api/v1/rooms/:id`

`:id` is the MongoDB document ID.

`200 OK` response:

```json
{
  "data": {
    "id": "66a1b2c3d4e5f67890123456",
    "type": "Double",
    "roomNumber": 204,
    "price": 150,
    "capacity": 2,
    "floor": 2,
    "description": "City view",
    "isAvailable": true,
    "createdAt": "2026-10-04T01:00:00.000Z",
    "updatedAt": "2026-10-04T01:00:00.000Z"
  }
}
```

- `400 Bad Request`: `:id` is not a valid MongoDB ObjectId.
- `404 Not Found`: no room exists with that ID.

### Update a room

`PATCH /api/v1/rooms/:id`

`:id` is the MongoDB document ID. The request body is a partial room object;
omitted fields remain unchanged.

Request body:

```json
{
  "price": 110,
  "isAvailable": false
}
```

Accepts one or more of `type`, `roomNumber`, `price`, `capacity`, `floor`,
`description`, or `isAvailable`. The same schema rules as creation apply to
provided values.

`200 OK` response:

```json
{
  "data": {
    "id": "66a1b2c3d4e5f67890123456",
    "type": "Double",
    "roomNumber": 204,
    "price": 110,
    "capacity": 2,
    "floor": 2,
    "description": "City view",
    "isAvailable": false,
    "createdAt": "2026-10-04T01:00:00.000Z",
    "updatedAt": "2026-10-04T02:00:00.000Z"
  }
}
```

- `400 Bad Request`: invalid ID or invalid field values.
- `404 Not Found`: no room exists with that ID.
- `409 Conflict`: `roomNumber` is already assigned to another room.

### Delete a room

`DELETE /api/v1/rooms/:id`

`:id` is the MongoDB document ID.

- `204 No Content`: room deleted successfully; response has no body.
- `400 Bad Request`: `:id` is not a valid MongoDB ObjectId.
- `404 Not Found`: no room exists with that ID.

## Error response object

Proposed common error response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [
      {
        "field": "type",
        "message": "Must be Single or Double."
      }
    ]
  }
}
```

Use `400 Bad Request` for malformed input or schema validation errors,
`404 Not Found` when the requested room does not exist, and `409 Conflict` for
duplicate `roomNumber` values. Error codes should be stable for clients; messages
and `details` may provide more context.

## Availability scope

`isAvailable` is the schema's single current availability flag. This contract does
not define date-based availability or reservation conflict checks because the
current schema has no booking relationship or date range. Those behaviors should
be defined with the booking API rather than inferred from this field.
