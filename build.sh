#!/bin/bash
set -e

# Default environment is production
ENV=${ENV:-production}
echo "Building for environment: $ENV"

# Load environment variables from the appropriate .env file
if [ -f "frontend/.env.$ENV" ]; then
    echo "Loading environment variables from frontend/.env.$ENV"
    export $(cat frontend/.env.$ENV | grep -v '^#' | xargs)
else
    echo "Warning: No .env.$ENV file found in frontend directory"
fi

# Allow override of VITE_API_URL through command line
VITE_API_URL=${VITE_API_URL:-${VITE_API_URL:-http://localhost:3000}}
echo "Using API URL: $VITE_API_URL"

echo "Building frontend..."
cd frontend
bun install

# Export variables for Vite to pick up
export VITE_API_URL
export NODE_ENV=$ENV

echo "Running build..."
bun run build

echo "Copying static files..."
cd ..
rm -rf static
mkdir -p static
cp -r frontend/dist/* static/

echo "Build complete!"

# Usage information if no arguments provided
if [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
    echo "Usage:"
    echo "  ./build.sh                          # Builds with production environment"
    echo "  ENV=development ./build.sh          # Builds with development environment"
    echo "  VITE_API_URL=https://api.example.com ./build.sh  # Overrides API URL"
    echo ""
    echo "Environment Variables:"
    echo "  ENV            - Build environment (development/staging/production)"
    echo "  VITE_API_URL   - Override the API URL"
    exit 0
fi
