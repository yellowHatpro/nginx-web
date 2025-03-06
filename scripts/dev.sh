#!/bin/bash
set -e

# Start the frontend and backend in parallel
echo "Starting Nginx Manager in development mode..."

# Start the backend
(cd backend && cargo run) &
BACKEND_PID=$!

# Start the frontend
(cd frontend && npm run dev) &
FRONTEND_PID=$!

# Handle termination
trap "kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

# Wait for both processes
wait 