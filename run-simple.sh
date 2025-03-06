#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Nginx Manager...${NC}"

# Function to stop all processes on exit
cleanup() {
  echo -e "\n${YELLOW}Stopping all services...${NC}"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

# Set up trap to catch Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM

# Start the backend
echo -e "${YELLOW}Starting backend server...${NC}"
(cd backend && cargo run) &
BACKEND_PID=$!
echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"

# Give the backend a moment to start
sleep 2

# Start the frontend
echo -e "${YELLOW}Starting frontend server...${NC}"
cd frontend && npm run dev 