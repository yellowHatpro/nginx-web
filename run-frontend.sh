#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Nginx Manager Frontend...${NC}"
cd frontend
echo -e "${YELLOW}Installing dependencies and starting frontend server...${NC}"
npm install
npm run dev 