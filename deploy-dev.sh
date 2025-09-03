#!/bin/bash

# Batal Academy Dev Environment Setup Script
# This script sets up the dev server environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🏟️  Setting up Batal Academy Dev Environment${NC}"

# Check if we're running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root or with sudo${NC}"
   exit 1
fi

# Variables
PROJECT_NAME="batal-dev"
DOMAIN="batal.dev.nabiljarrai.com"
PROJECT_DIR="/opt/batal"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"

echo -e "${YELLOW}📂 Setting up dev environment${NC}"
cd $PROJECT_DIR

echo -e "${YELLOW}🌐 Setting up Dev Nginx configuration${NC}"
# Copy dev nginx configuration
cp nginx-batal-dev.conf $NGINX_SITES_AVAILABLE/$PROJECT_NAME

# Enable the dev site
ln -sf $NGINX_SITES_AVAILABLE/$PROJECT_NAME $NGINX_SITES_ENABLED/

echo -e "${YELLOW}🔒 Setting up SSL certificate for dev subdomain${NC}"
# Get SSL certificate for dev subdomain
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email nabil@nabiljarrai.com

echo -e "${YELLOW}🔄 Restarting Nginx${NC}"
nginx -t && systemctl reload nginx

echo -e "${YELLOW}🐳 Starting dev services with Docker Compose${NC}"
# Start dev environment services
docker-compose -f docker-compose.yml -f docker-compose.dev-deploy.yml up -d

echo -e "${GREEN}✅ Dev environment setup completed successfully!${NC}"
echo -e "${GREEN}🎉 Dev server is now accessible at https://${DOMAIN}${NC}"

echo -e "${YELLOW}📝 Next Steps:${NC}"
echo -e "1. Check service status: docker-compose ps"
echo -e "2. View logs: docker-compose logs -f"
echo -e "3. Test API: curl https://${DOMAIN}/api/health"