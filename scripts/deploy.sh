#!/bin/bash
set -e

# Configuration
DEPLOY_DIR=${DEPLOY_DIR:-"/opt/nginx-manager"}
NGINX_CONFIG_DIR=${NGINX_CONFIG_DIR:-"/etc/nginx"}
SYSTEMD_SERVICE_DIR=${SYSTEMD_SERVICE_DIR:-"/etc/systemd/system"}

# Build the application
echo "Building application..."
./scripts/build.sh

# Create deployment directory
echo "Creating deployment directory..."
sudo mkdir -p $DEPLOY_DIR
sudo mkdir -p $DEPLOY_DIR/frontend
sudo mkdir -p $DEPLOY_DIR/backend

# Copy frontend files
echo "Copying frontend files..."
sudo cp -r frontend/dist/* $DEPLOY_DIR/frontend/

# Copy backend binary
echo "Copying backend binary..."
sudo cp backend/target/release/nginx-manager-backend $DEPLOY_DIR/backend/

# Copy environment file
echo "Copying environment configuration..."
if [ -f .env ]; then
  sudo cp .env $DEPLOY_DIR/
else
  echo "Warning: .env file not found. Using example configuration."
  sudo cp .env.example $DEPLOY_DIR/.env
fi

# Create systemd service file
echo "Creating systemd service..."
cat > nginx-manager.service << EOF
[Unit]
Description=Nginx Manager
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$DEPLOY_DIR
Environment="RUST_LOG=info"
EnvironmentFile=$DEPLOY_DIR/.env
ExecStart=$DEPLOY_DIR/backend/nginx-manager-backend
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

sudo mv nginx-manager.service $SYSTEMD_SERVICE_DIR/

# Configure Nginx
echo "Configuring Nginx..."
cat > nginx-manager.conf << EOF
server {
    listen 80;
    server_name nginx-manager.local;

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location / {
        root $DEPLOY_DIR/frontend;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

sudo mv nginx-manager.conf $NGINX_CONFIG_DIR/conf.d/

# Reload services
echo "Reloading services..."
sudo systemctl daemon-reload
sudo systemctl enable nginx-manager
sudo systemctl restart nginx-manager
sudo nginx -t && sudo systemctl reload nginx

echo "Deployment completed successfully!"
echo "Nginx Manager is now available at http://nginx-manager.local" 