#!/bin/bash

# Default values
API_URL="http://localhost:8080"
RELEASE_MODE=false
BINARY_MODE=false

# Parse command line arguments
for arg in "$@"
do
    case $arg in
        api-domain=*)
        API_URL="${arg#*=}"
        shift
        ;;
        --release)
        RELEASE_MODE=true
        shift
        ;;
        --binary)
        BINARY_MODE=true
        shift
        ;;
    esac
done

echo "Building project with API_URL: $API_URL"
echo "Release mode: $RELEASE_MODE"

# Check if cargo is installed
if ! command -v cargo &> /dev/null; then
    echo "cargo is not installed. Please install Rust and cargo first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Build frontend
echo "Building frontend..."
# Create .env file for Vite
echo "VITE_API_URL=$API_URL" > frontend/.env

# Install frontend dependencies and build
cd frontend
npm install
npm run build
cd ..

# Create static directory and copy frontend build
mkdir -p static
rm -rf static/*
cp -r frontend/dist/* static/

# Build Rust project
echo "Building Rust project..."
if [ "$RELEASE_MODE" = true ]; then
    cargo build --release
    
    # Create release directory
    mkdir -p release
    
    # Copy only the binary to release directory
    cp target/release/simplelink release/
    cp .env.example release/.env
    
    # Create a tar archive
    tar -czf release.tar.gz release/
    
    echo "Release archive created: release.tar.gz"
elif [ "$BINARY_MODE" = true ]; then
    cargo build --release
else
    cargo build
fi

echo "Build complete!"
echo "To run the project:"
if [ "$RELEASE_MODE" = true ]; then
    echo "1. Extract release.tar.gz"
    echo "2. Configure .env file"
    echo "3. Run ./simplelink"
else
    echo "1. Configure .env file"
    echo "2. Run 'cargo run'"
fi
