#!/bin/bash
set -e

echo "Building Nginx Manager for production..."

# Build the frontend
echo "Building frontend..."
cd frontend
npm run build
cd ..

# Build the backend
echo "Building backend..."
cd backend
cargo build --release
cd ..

echo "Build completed successfully!" 