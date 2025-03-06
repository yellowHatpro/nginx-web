# Nginx Manager

A comprehensive Nginx management UI with traffic monitoring, load balancer configuration, and config file management.

## Features

- **Traffic Dashboard**: Monitor Nginx ingress traffic with detailed information about source IPs, request times, and more
- **Load Balancer Configuration**: Visual drag-and-drop interface for configuring Nginx load balancing
- **Config Manager**: User-friendly interface for managing Nginx configuration files

## Architecture

- **Frontend**: React application with TailwindCSS and ReactFlow
- **Backend**: Rust-based API server that interacts directly with Nginx config and log files
- **No Database Required**: All data is stored in Nginx configuration and log files

## Prerequisites

- Node.js 18+ and npm/pnpm
- Rust 1.70+
- Nginx installed and accessible

## Development Setup

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/nginx-manager.git
   cd nginx-manager
   ```

2. Install dependencies:

   ```
   npm install
   cd frontend && npm install
   ```

3. Start the development servers:

   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Production Deployment

1. Build the application:

   ```
   npm run build
   ```

2. Deploy the built application:
   ```
   ./scripts/deploy.sh
   ```

## Configuration

The application can be configured using environment variables or a `.env` file. See `.env.example` for available options.

## License

MIT
