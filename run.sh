#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Nginx Manager...${NC}"

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo -e "${RED}tmux is not installed. Please install it to run this script.${NC}"
    echo "You can install it with: brew install tmux (on macOS) or apt-get install tmux (on Ubuntu)"
    exit 1
fi

# Create a new tmux session
SESSION_NAME="nginx-manager"
tmux new-session -d -s $SESSION_NAME

# Split the window horizontally
tmux split-window -h -t $SESSION_NAME

# Run backend in the left pane
tmux send-keys -t $SESSION_NAME:0.0 "cd backend && echo -e '${YELLOW}Starting backend server...${NC}' && cargo run" C-m

# Run frontend in the right pane
tmux send-keys -t $SESSION_NAME:0.1 "cd frontend && echo -e '${YELLOW}Starting frontend server...${NC}' && npm run dev" C-m

# Attach to the session
echo -e "${GREEN}Services starting in tmux session. Attaching to session...${NC}"
echo -e "${YELLOW}To detach from the session, press Ctrl+B then D${NC}"
echo -e "${YELLOW}To kill the session, press Ctrl+B then :kill-session${NC}"

tmux attach-session -t $SESSION_NAME 