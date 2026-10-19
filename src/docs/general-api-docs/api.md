# API Response Contract

This contract defines the standard success and error response shape for all REST endpoints in this project.

## General rules

- All responses should be JSON.
- Success responses use a consistent envelope with `data` and optional `pagination`.
- Error responses use an `error` object.
- HTTP status codes must match the outcome of the request.
- Do not expose raw database objects or internal stack traces to clients.

## Success response

### Standard success envelope

```json
{
  "data": {
    "id": "66a1b2c3d4e5f67890123456"
  }
}
```

### For list endpoints

```json
{
  "data": [
    {
      "id": "66a1b2c3d4e5f67890123456",
      "name": "Room 204"
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

### For create/update/delete endpoints

- `POST` and `PATCH` usually return the updated resource in `data`.
- `DELETE` should return `204 No Content` and no response body.

### Success status codes

- `200 OK` — successful fetch or update
- `201 Created` — successful creation
- `204 No Content` — successful delete with no body

## Error response

### Standard error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [
      {
        "field": "roomNumber",
        "message": "Room number is required."
      }
    ]
  }
}
```

### Error object contract

```json
{
  "code": "STRING",
  "message": "STRING",
  "details": [
    {
      "field": "STRING",
      "message": "STRING"
    }
  ]
}
```

### Error status codes

- `400 Bad Request` — malformed request, invalid payload, or validation failed
- `401 Unauthorized` — user is not authenticated
- `403 Forbidden` — user is authenticated but not allowed to perform the action
- `404 Not Found` — resource does not exist
- `409 Conflict` — duplicate unique value or conflicting state
- `422 Unprocessable Entity` — semantic validation failure that is structurally valid but not allowed
- `500 Internal Server Error` — unexpected server-side failure

## Common status conventions

### Success

```json
{
  "data": { ... }
}
```

### List success

```json
{
  "data": [ ... ],
  "pagination": { ... }
}
```

### Failure

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": []
  }
}
```

## Contract summary

Every endpoint must follow one of these response patterns:

1. Success with object payload
   ```json
   {
     "data": { ... }
   }
   ```

2. Success with array payload
   ```json
   {
     "data": [ ... ]
   }
   ```

3. Success with pagination
   ```json
   {
     "data": [ ... ],
     "pagination": { ... }
   }
   ```

4. Error payload
   ```json
   {
     "error": {
       "code": "ERROR_CODE",
       "message": "...",
       "details": []
     }
   }
   ```

## Notes

- `details` should be an array of objects when there are field-level validation messages; it may be empty for generic errors.
- For a `DELETE` operation, use `204 No Content` and omit the response body entirely.
