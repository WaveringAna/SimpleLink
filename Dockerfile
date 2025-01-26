# Frontend build stage
FROM oven/bun:latest as frontend-builder
WORKDIR /app/frontend

# Install bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Copy frontend files
COPY frontend/package.json frontend/bun.lock ./
RUN bun install

COPY frontend/ ./

# Build frontend with environment variables
# These can be overridden at build time
ARG VITE_API_URL=http://localhost:3000
ARG NODE_ENV=production
ENV VITE_API_URL=$VITE_API_URL
ENV NODE_ENV=$NODE_ENV

RUN echo "VITE_API_URL=${VITE_API_URL}" > .env.production
RUN bun run build

# Rust build stage
FROM rust:latest as backend-builder

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

# Build application
ARG RUST_ENV=release
RUN cargo build --${RUST_ENV}

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y libpq5 ca-certificates openssl libssl3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the binary and migrations from backend builder
COPY --from=backend-builder /usr/src/app/target/release/simplelink /app/simplelink
COPY --from=backend-builder /usr/src/app/migrations /app/migrations

# Copy static files from frontend builder
COPY --from=frontend-builder /app/frontend/dist /app/static

# Expose the port
EXPOSE 3000

# Set default network configuration
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=3000

# Run the binary
CMD ["./simplelink"]
