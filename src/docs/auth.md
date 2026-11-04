# Authentication Module

Authentication uses Google OAuth 2.0 through Passport and issues a JWT after a
successful Google sign-in. The application does not use Passport sessions.

## Configuration

The server loads environment variables before initializing the app and requires:

| Variable | Use |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL registered with Google |
| `JWT_SECRET` | JWT signing and verification secret |
| `JWT_EXPIRES_IN` | JWT expiration accepted by `jsonwebtoken` |

`src/config/passport.js` configures the Google strategy from these variables.
The app loads this strategy before mounting the authentication routes. Set
`GOOGLE_CALLBACK_URL` to the exact public URL of `/api/v1/auth/google/callback`.

## Endpoints

| Method | Endpoint | Access | Behavior |
| --- | --- | --- | --- |
| `GET` | `/api/v1/auth/google` | Public | Starts Google OAuth with `profile` and `email` scopes, state enabled, and sessions disabled. |
| `GET` | `/api/v1/auth/google/callback` | Public callback | Google returns the authorization response here; Passport loads or creates the user, then the controller issues the JWT cookie. |
| `GET` | `/api/v1/auth/login-failed` | Public | Returns the standardized `401 Unauthorized` error used by the callback's failure redirect. |

The callback route configures `failureRedirect: '/api/v1/auth/login-failed'`.
After Passport authentication succeeds, the callback controller runs. Passport
is configured with `session: false` on both OAuth routes.

## Google account handling

The Google strategy passes the provider profile to
`findOrCreateGoogleUser`:

- The service requires the profile to contain an email.
- It searches by either Google ID or email.
- If an email-matched account has no `googleId`, it attaches the Google ID and
  saves the user.
- Otherwise, it creates a user using the Google ID, display name (or
  `Google User` fallback), email, and first profile photo (or an empty string).
- The User model defaults new users to the `user` role.

The User schema also requires a unique `googleId`, `userName`, and unique
`email`; see [Users Module](./users.md#user-schema) for its fields and
constraints.

## JWT and cookie

On callback success, the server signs a JWT with payload fields `id` (from
`user._id`) and `role`, using `JWT_SECRET` and `JWT_EXPIRES_IN`. The controller
sets the token in a cookie named `token` with:

| Cookie option | Current value |
| --- | --- |
| `httpOnly` | `true` |
| `secure` | `true` only when `NODE_ENV === 'production'` |
| `sameSite` | `lax` |
| `maxAge` | 30 days |

The controller does not return the JWT in its JSON response. The successful
response is `200 OK`:

```json
{
  "data": {
    "message": "Logged in successfully",
    "user": {
      "id": "66a1b2c3d4e5f67890123456",
      "userName": "Example User",
      "email": "user@example.com",
      "role": "user",
      "profileImage": "",
      "phone": ""
    }
  }
}
```

The app installs `cookie-parser` before the routes. Protected-route middleware
accepts a JWT from `Authorization: Bearer <token>` or, if that header is not
used, from the `token` cookie. It verifies the JWT with `JWT_SECRET` and sets
the decoded payload on `req.user`.

## Errors

Errors use the application error envelope:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Google authentication failed or was cancelled.",
    "details": []
  }
}
```

The `/login-failed` endpoint throws an application `401` error. A callback
without `req.user` also results in `401`. A Google profile without an email is
rejected by the user service with `400`. Other unhandled errors are passed to
the centralized error middleware.
