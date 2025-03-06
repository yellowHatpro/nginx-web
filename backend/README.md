# Nginx Manager Backend

This is the backend for the Nginx Manager application. It's built with Rust and provides APIs for managing Nginx configurations, monitoring traffic, and configuring load balancing.

## Features

- **Config Management**: APIs for managing Nginx configuration files
- **Traffic Monitoring**: APIs for monitoring Nginx traffic logs
- **Load Balancer Configuration**: APIs for configuring Nginx load balancing

## Development

### Prerequisites

- Rust 1.70+
- Nginx installed and accessible

### Setup

1. Install dependencies:

   ```
   cargo build
   ```

2. Create a `.env` file in the root directory with the following content:

   ```
   RUST_LOG=debug
   PORT=3000
   HOST=127.0.0.1
   NGINX_CONFIG_DIR=/etc/nginx
   NGINX_LOG_DIR=/var/log/nginx
   NGINX_BINARY=/usr/sbin/nginx
   API_KEY_REQUIRED=false
   API_KEY=dev_api_key
   ```

3. Run the server:
   ```
   cargo run
   ```

## API Endpoints

### Health Check

- `GET /api/health`: Check if the server is running

### Config Management

- `GET /api/config`: List all Nginx configuration files
- `GET /api/config/:id`: Get a specific configuration file
- `PUT /api/config/:id`: Update a configuration file
- `POST /api/config/:id/deploy`: Deploy a configuration file

### Traffic Monitoring

- `GET /api/traffic`: Get traffic logs
- `GET /api/traffic/stats`: Get traffic statistics
- `GET /api/traffic/realtime`: WebSocket endpoint for real-time traffic updates

### Load Balancer Configuration

- `GET /api/load-balancer/servers`: List all servers
- `POST /api/load-balancer/servers`: Add a new server
- `GET /api/load-balancer/servers/:id`: Get a specific server
- `PUT /api/load-balancer/servers/:id`: Update a server
- `DELETE /api/load-balancer/servers/:id`: Remove a server
- `GET /api/load-balancer/servers/:id/health`: Check server health

## Production Deployment

For production deployment, see the main README.md file in the root directory.
