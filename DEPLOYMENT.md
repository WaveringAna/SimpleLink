# SimpleLink Deployment Guide

## Environment Configuration

### Environment Files

#### Development (.env.development)
```env
VITE_API_URL=http://localhost:3000
NODE_ENV=development
RUST_ENV=debug
JWT_SECRET=dev-secret-key
POSTGRES_DB=shortener_dev
POSTGRES_USER=shortener
POSTGRES_PASSWORD=shortener123
```

#### Production (.env.production)
```env
VITE_API_URL=https://your-production-domain.com
NODE_ENV=production
RUST_ENV=release
JWT_SECRET=your-secure-production-key
POSTGRES_DB=shortener_prod
POSTGRES_USER=shortener_prod
POSTGRES_PASSWORD=secure-password
```

#### Staging (.env.staging)
```env
VITE_API_URL=https://staging.your-domain.com
NODE_ENV=production
RUST_ENV=release
JWT_SECRET=your-staging-key
POSTGRES_DB=shortener_staging
POSTGRES_USER=shortener_staging
POSTGRES_PASSWORD=staging-password
```

## Docker Deployment

### Basic Commands

```bash
# Build and run with specific environment
docker-compose --env-file .env.development up --build   # Development
docker-compose --env-file .env.staging up --build       # Staging
docker-compose --env-file .env.production up --build    # Production

# Run in detached mode
docker-compose --env-file .env.production up -d --build

# Stop containers
docker-compose down

# View logs
docker-compose logs -f
```

### Override Single Variables
```bash
VITE_API_URL=https://custom-domain.com docker-compose up --build
```

### Using Docker Compose Override Files

#### Development (docker-compose.dev.yml)
```yaml
services:
  app:
    build:
      args:
        VITE_API_URL: http://localhost:3000
        NODE_ENV: development
        RUST_ENV: debug
    volumes:
      - ./src:/usr/src/app/src
    environment:
      RUST_LOG: debug
```

#### Production (docker-compose.prod.yml)
```yaml
services:
  app:
    build:
      args:
        VITE_API_URL: https://your-production-domain.com
        NODE_ENV: production
        RUST_ENV: release
    deploy:
      replicas: 2
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Using Override Files
```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build
```

## Environment Variables Reference

### Build-time Variables
- `VITE_API_URL`: Frontend API endpoint
- `NODE_ENV`: Node.js environment (development/production)
- `RUST_ENV`: Rust build type (debug/release)

### Runtime Variables
- `SERVER_HOST`: Backend host address
- `SERVER_PORT`: Backend port
- `JWT_SECRET`: JWT signing key
- `RUST_LOG`: Logging level
- `DATABASE_URL`: PostgreSQL connection string

### Database Variables
- `POSTGRES_DB`: Database name
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password

## Container Structure

### Frontend Container
- Build tool: Bun
- Source: `/app/frontend`
- Output: `/app/frontend/dist`
- Static files location: `/app/static`

### Backend Container
- Build tool: Cargo
- Source: `/usr/src/app`
- Binary: `/app/simplelink`
- Migrations: `/app/migrations`

## Production Deployment Checklist

1. Environment Setup
   - [ ] Set secure database passwords
   - [ ] Generate strong JWT secret
   - [ ] Configure proper API URL
   - [ ] Set appropriate logging levels

2. Database
   - [ ] Configure backup strategy
   - [ ] Set up proper indexes
   - [ ] Configure connection pooling

3. Security
   - [ ] Enable SSL/TLS
   - [ ] Set up proper firewalls
   - [ ] Configure CORS properly
   - [ ] Use secrets management

4. Monitoring
   - [ ] Set up logging aggregation
   - [ ] Configure health checks
   - [ ] Set up metrics collection

5. Performance
   - [ ] Configure proper cache headers
   - [ ] Set up CDN if needed
   - [ ] Configure database connection pool size

## Common Operations

### View Container Logs
```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f app
docker-compose logs -f db
```

### Access Database
```bash
# Connect to database container
docker-compose exec db psql -U shortener -d shortener

# Backup database
docker-compose exec db pg_dump -U shortener shortener > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T db psql -U shortener -d shortener
```

### Container Management
```bash
# Restart single service
docker-compose restart app

# View container status
docker-compose ps

# View resource usage
docker-compose top
```

## Troubleshooting

### Database Connection Issues
1. Check if database container is running:
   ```bash
   docker-compose ps db
   ```
2. Verify database credentials in environment files
3. Check database logs:
   ```bash
   docker-compose logs db
   ```

### Frontend Build Issues
1. Clear node_modules and rebuild:
   ```bash
   docker-compose down
   rm -rf frontend/node_modules
   docker-compose up --build
   ```

### Backend Issues
1. Check backend logs:
   ```bash
   docker-compose logs app
   ```
2. Verify environment variables are set correctly
3. Check database connectivity

## Build Script Usage

The `build.sh` script handles environment-specific builds and static file generation.

### Basic Usage
```bash
# Default production build
./build.sh

# Development build
ENV=development ./build.sh

# Staging build
ENV=staging ./build.sh

# Production build with custom API URL
VITE_API_URL=https://api.example.com ./build.sh

# Development build with custom API URL
ENV=development VITE_API_URL=http://localhost:8080 ./build.sh

# Show help
./build.sh --help