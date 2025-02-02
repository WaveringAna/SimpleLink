# Frontend build stage
FROM oven/bun:latest AS frontend-builder

WORKDIR /usr/src/frontend

# Copy frontend files
COPY frontend/package.json ./
RUN bun install

COPY frontend/ ./

# Build frontend with production configuration
ARG API_URL=http://localhost:8080
ENV VITE_API_URL=${API_URL}
RUN bun run build

# Rust build stage
FROM rust:latest AS backend-builder

# Install PostgreSQL client libraries and SSL dependencies
RUN apt-get update && \
    apt-get install -y pkg-config libssl-dev libpq-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy manifests first (better layer caching)
COPY Cargo.toml Cargo.lock ./

# Copy source code and SQLx prepared queries
COPY src/ src/
COPY migrations/ migrations/
COPY .sqlx/ .sqlx/

# Create static directory and copy frontend build
COPY --from=frontend-builder /usr/src/frontend/dist/ static/

# Build the application
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y libpq5 ca-certificates openssl libssl3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the binary from builder
COPY --from=backend-builder /usr/src/app/target/release/simplelink /app/simplelink

# Copy migrations folder for SQLx
COPY --from=backend-builder /usr/src/app/migrations /app/migrations

# Copy static files
COPY --from=backend-builder /usr/src/app/static /app/static

# Expose the port
EXPOSE 8080

# Set default network configuration
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=8080

# Run the binary
CMD ["./simplelink"]
