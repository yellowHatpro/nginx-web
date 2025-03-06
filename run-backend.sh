#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Nginx Manager Backend...${NC}"
cd backend
echo -e "${YELLOW}Building and running backend server...${NC}"
cargo run 