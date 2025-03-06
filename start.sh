#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Nginx Manager...${NC}"

# Create a log directory if it doesn't exist
mkdir -p logs

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
(cd backend && cargo run) > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"

# Start the frontend
echo -e "${YELLOW}Starting frontend server...${NC}"
(cd frontend && npm run dev) > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started with PID: $FRONTEND_PID${NC}"

echo -e "${GREEN}Both services are running!${NC}"
echo -e "${YELLOW}Backend logs: tail -f logs/backend.log${NC}"
echo -e "${YELLOW}Frontend logs: tail -f logs/frontend.log${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for user to press Ctrl+C
wait 