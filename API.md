# Link Shortener API Documentation

## Base URL
`http://localhost:8080`

## Endpoints

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
Create a new shortened URL with optional custom code.

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
  -d '{
    "url": "https://example.com",
    "source": "curl-test"
  }'
```

Response (201 Created):
```json
{
  "id": 1,
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

### Get All Links
Retrieve all shortened URLs.

```bash
GET /api/links
```

Example:
```bash
curl http://localhost:8080/api/links
```

Response (200 OK):
```json
[
  {
    "id": 1,
    "original_url": "https://example.com",
    "short_code": "Xa7Bc9",
    "created_at": "2024-03-01T12:34:56Z",
    "clicks": 5
  },
  {
    "id": 2,
    "original_url": "https://example.org",
    "short_code": "example",
    "created_at": "2024-03-01T12:35:00Z",
    "clicks": 3
  }
]
```

### Redirect to Original URL
Use the shortened URL to redirect to the original URL.

```bash
GET /{short_code}
```

Example:
```bash
curl -i http://localhost:8080/example
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
3. Source tracking is optional but recommended for analytics
4. Custom codes are case-sensitive
5. URLs must include protocol (http:// or https://)

## Error Codes

- 200: Success
- 201: Created
- 307: Temporary Redirect
- 400: Bad Request (invalid input)
- 404: Not Found
- 503: Service Unavailable

## Database Schema

```sql
CREATE TABLE links (
    id SERIAL PRIMARY KEY,
    original_url TEXT NOT NULL,
    short_code VARCHAR(8) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    clicks BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE clicks (
    id SERIAL PRIMARY KEY,
    link_id INTEGER REFERENCES links(id),
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
