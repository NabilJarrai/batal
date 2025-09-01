#!/bin/bash

# Batal Academy Initial Server Setup Script
# This script sets up the server environment for GitHub Actions deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🏟️  Setting up Batal Academy Server Environment${NC}"

# Check if we're running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root or with sudo${NC}"
   exit 1
fi

# Variables
PROJECT_NAME="batal"
DOMAIN="batal.nabiljarrai.com"
PROJECT_DIR="/opt/batal"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"

echo -e "${YELLOW}� Installing required packages${NC}"
apt update
apt install -y nginx certbot python3-certbot-nginx docker.io docker-compose git

echo -e "${YELLOW}🐳 Setting up Docker${NC}"
systemctl enable docker
systemctl start docker
usermod -aG docker $(whoami)

echo -e "${YELLOW}📂 Setting up project directory${NC}"
mkdir -p $PROJECT_DIR

echo -e "${YELLOW}� Cloning repository${NC}"
if [ ! -d "$PROJECT_DIR/.git" ]; then
    git clone https://github.com/NabilJarrai/batal.git $PROJECT_DIR
else
    cd $PROJECT_DIR && git pull origin main
fi

cd $PROJECT_DIR

echo -e "${YELLOW}🌐 Setting up Nginx configuration${NC}"
# Copy nginx configuration
cp nginx-batal.conf $NGINX_SITES_AVAILABLE/$PROJECT_NAME

# Enable the site
ln -sf $NGINX_SITES_AVAILABLE/$PROJECT_NAME $NGINX_SITES_ENABLED/

echo -e "${YELLOW}🔒 Setting up SSL certificate${NC}"
# Get SSL certificate
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email nabil@nabiljarrai.com

echo -e "${YELLOW}🔄 Restarting Nginx${NC}"
nginx -t && systemctl reload nginx

echo -e "${GREEN}✅ Server setup completed successfully!${NC}"
echo -e "${GREEN}🎉 Server is ready for GitHub Actions deployment${NC}"

echo -e "${YELLOW}📝 Next Steps:${NC}"
echo -e "1. Add GitHub Secrets to your repository"
echo -e "2. Push your code to trigger the deployment"
echo -e "3. Monitor the GitHub Actions workflow"
