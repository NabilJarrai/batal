#!/bin/bash

# Batal Academy Update Script
# This script updates the deployed Batal Football Academy Management System

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_DIR="/opt/batal"

cd $PROJECT_DIR

echo -e "${GREEN}🔄 Updating Batal Academy${NC}"

echo -e "${YELLOW}📥 Pulling latest changes${NC}"
git pull origin main

echo -e "${YELLOW}🐳 Rebuilding containers${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

echo -e "${YELLOW}🧹 Cleaning up unused images${NC}"
docker image prune -f

echo -e "${GREEN}✅ Update completed successfully!${NC}"
echo -e "${YELLOW}📊 Container status:${NC}"
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
