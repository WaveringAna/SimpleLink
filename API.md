# Link Shortener API Documentation

## Base URL
`http://localhost:8080`

## Authentication
The API uses JWT tokens for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_token>
```

### Register
Create a new user account.

```bash
POST /api/auth/register
```

Request Body:
```json
{
  "email": string,     // Required: Valid email address
  "password": string   // Required: Password
}
```

Example:
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'
```

Response (200 OK):
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### Login
Authenticate and receive a JWT token.

```bash
POST /api/auth/login
```

Request Body:
```json
{
  "email": string,     // Required: Registered email address
  "password": string   // Required: Password
}
```

Example:
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "your_password"
  }'
```

Response (200 OK):
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

## Protected Endpoints

### Health Check
Check if the service and database are running.

```bash
GET /health
```

Example:
```bash
curl http://localhost:8080/health
```

Response (200 OK):
```json
"Healthy"
```

Response (503 Service Unavailable):
```json
"Database unavailable"
```

### Create Short URL
Create a new shortened URL with optional custom code. Requires authentication.

```bash
POST /api/shorten
```

Request Body:
```json
{
  "url": string,           // Required: The URL to shorten
  "custom_code": string,   // Optional: Custom short code
  "source": string        // Optional: Source of the request
}
```

Examples:

1. Create with auto-generated code:
```bash
curl -X POST http://localhost:8080/api/shorten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "url": "https://example.com",
    "source": "curl-test"
  }'
```

Response (201 Created):
```json
{
  "id": 1,
  "user_id": 1,
  "original_url": "https://example.com",
  "short_code": "Xa7Bc9",
  "created_at": "2024-03-01T12:34:56Z",
  "clicks": 0
}
```

2. Create with custom code:
```bash
curl -X POST http://localhost:8080/api/shorten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "url": "https://example.com",
    "custom_code": "example",
    "source": "curl-test"
  }'
```

Response (201 Created):
```json
{
  "id": 2,
  "user_id": 1,
  "original_url": "https://example.com",
  "short_code": "example",
  "created_at": "2024-03-01T12:34:56Z",
  "clicks": 0
}
```

Error Responses:

Invalid URL (400 Bad Request):
```json
{
  "error": "URL must start with http:// or https://"
}
```

Custom code taken (400 Bad Request):
```json
{
  "error": "Custom code already taken"
}
```

Invalid custom code (400 Bad Request):
```json
{
  "error": "Custom code must be 1-32 characters long and contain only letters, numbers, underscores, and hyphens"
}
```

Unauthorized (401 Unauthorized):
```json
{
  "error": "Unauthorized"
}
```

### Get All Links
Retrieve all shortened URLs for the authenticated user.

```bash
GET /api/links
```

Example:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8080/api/links
```

Response (200 OK):
```json
[
  {
    "id": 1,
    "user_id": 1,
    "original_url": "https://example.com",
    "short_code": "Xa7Bc9",
    "created_at": "2024-03-01T12:34:56Z",
    "clicks": 5
  },
  {
    "id": 2,
    "user_id": 1,
    "original_url": "https://example.org",
    "short_code": "example",
    "created_at": "2024-03-01T12:35:00Z",
    "clicks": 3
  }
]
```

### Redirect to Original URL
Use the shortened URL to redirect to the original URL. Source tracking via query parameter is supported.

```bash
GET /{short_code}?source={source}
```

Example:
```bash
curl -i http://localhost:8080/example?source=email
```

Response (307 Temporary Redirect):
```http
HTTP/1.1 307 Temporary Redirect
Location: https://example.com
```

Error Response (404 Not Found):
```json
{
  "error": "Not found"
}
```

## Custom Code Rules
1. Length: 1-32 characters
2. Allowed characters: letters, numbers, underscores, and hyphens
3. Case-sensitive
4. Cannot use reserved words: ["api", "health", "admin", "static", "assets"]

## Rate Limiting
Currently, no rate limiting is implemented.

## Notes
1. All timestamps are in UTC
2. Click counts are incremented on successful redirects
3. Source tracking is supported both at link creation and during redirection via query parameter
4. Custom codes are case-sensitive
5. URLs must include protocol (http:// or https://)
6. All create/read operations require authentication
7. Users can only see and manage their own links

## Error Codes
- 200: Success
- 201: Created
- 307: Temporary Redirect
- 400: Bad Request (invalid input)
- 401: Unauthorized (missing or invalid token)
- 404: Not Found
- 503: Service Unavailable

## Database Schema
```sql
-- Users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);

-- Links table with user association
CREATE TABLE links (
    id SERIAL PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_code VARCHAR(8) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    clicks BIGINT NOT NULL DEFAULT 0,
    user_id INTEGER REFERENCES users(id)
);

-- Click tracking with source information
CREATE TABLE clicks (
    id SERIAL PRIMARY KEY,
    link_id INTEGER REFERENCES links(id),
    source TEXT,
    query_source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_short_code ON links(short_code);
CREATE INDEX idx_user_id ON links(user_id);
CREATE INDEX idx_link_id ON clicks(link_id);
```
