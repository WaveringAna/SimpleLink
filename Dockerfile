# Build stage
FROM rust:latest as builder

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

# Build your application
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y libpq5 ca-certificates openssl libssl3 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /usr/src/app/target/release/simplelink /app/simplelink
# Copy migrations folder for SQLx
COPY --from=builder /usr/src/app/migrations /app/migrations

# Expose the port (this is just documentation)
EXPOSE 8080

# Set default network configuration
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=8080

# Run the binary
CMD ["./simplelink"]