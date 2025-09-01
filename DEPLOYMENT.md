# Batal Academy - GitHub Actions Deployment Guide

This guide will help you deploy the Batal Football Academy Management System using GitHub Actions to your VPS at `batal.nabiljarrai.com`.

## Prerequisites

- VPS with Ubuntu/Debian (your VPS: 31.97.216.38)
- GitHub repository with Actions enabled
- SSH access to your VPS
- Domain/subdomain configured (batal.nabiljarrai.com)

## Deployment Process

### 1. Initial Server Setup

Connect to your VPS and run the setup script:

```bash
ssh your-username@31.97.216.38
git clone https://github.com/NabilJarrai/batal.git /tmp/batal-setup
cd /tmp/batal-setup
sudo bash deploy.sh
```

This will:
- Install Docker, Nginx, Certbot
- Setup project directory at `/opt/batal`
- Configure Nginx reverse proxy
- Generate SSL certificate
- Clone your repository

### 2. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets (see `GITHUB_SECRETS.md` for details):

- `VPS_HOST` = 31.97.216.38
- `VPS_USER` = your_vps_username  
- `VPS_SSH_KEY` = your_private_ssh_key_content
- `POSTGRES_PASSWORD` = your_secure_password
- `MINIO_ROOT_USER` = admin
- `MINIO_ROOT_PASSWORD` = your_minio_password
- `JWT_SECRET` = your_jwt_secret
- Email secrets (optional)

### 3. Deploy

Simply push to your main/master branch:

```bash
git add .
git commit -m "Deploy Batal Academy"
git push origin main
```

GitHub Actions will automatically:
- Build Docker images
- Push to GitHub Container Registry
- Deploy to your VPS
- Start all services

### 4. Configure DNS

Make sure your DNS is configured to point `batal.nabiljarrai.com` to your VPS IP `31.97.216.38`.

Add an A record:
- Name: `batal`
- Type: `A`
- Value: `31.97.216.38`
- TTL: `300` (or default)

### 5. SSL Certificate

The deployment script will automatically obtain an SSL certificate using Let's Encrypt. Make sure to update the email in the `deploy.sh` script before running it.

## Environment Configuration

Edit the `.env` file with your actual values:

```bash
# Database Configuration
POSTGRES_PASSWORD=your_secure_postgres_password_here

# MinIO Configuration
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=your_secure_minio_password_here

# JWT Configuration
JWT_SECRET=your_very_long_jwt_secret_key_at_least_32_characters_long

# Email Configuration (optional)
SPRING_MAIL_HOST=smtp.gmail.com
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=your_email@gmail.com
SPRING_MAIL_PASSWORD=your_app_password
```

## Accessing the Application

After successful deployment:

- **Frontend**: https://batal.nabiljarrai.com
- **API**: https://batal.nabiljarrai.com/api
- **MinIO Console**: https://batal.nabiljarrai.com/minio (optional)

## Maintenance

### View Logs
```bash
cd /opt/batal
sudo docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

### Update Application
```bash
cd /opt/batal
sudo bash update.sh
```

### Restart Services
```bash
cd /opt/batal
sudo docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart
```

### Backup Database
```bash
sudo docker exec batal-postgres pg_dump -U batal_user batal_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Troubleshooting

### Check Container Status
```bash
sudo docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t
```

### Check SSL Certificate
```bash
sudo certbot certificates
```

### Check Application Logs
```bash
# Frontend logs
sudo docker logs batal-frontend

# Backend logs
sudo docker logs batal-backend

# Database logs
sudo docker logs batal-postgres
```

## Security Notes

1. Change all default passwords in the `.env` file
2. Regularly update the system and Docker images
3. Monitor logs for any suspicious activity
4. Set up regular backups
5. Consider setting up a firewall to restrict access to only necessary ports

## Port Information

The application uses the following ports internally:
- Frontend: 3000 (proxied through Nginx)
- Backend: 8080 (proxied through Nginx)
- Database: 5432 (internal only)
- MinIO: 9000, 9001 (internal only)

Only ports 80 and 443 should be exposed externally through Nginx.
