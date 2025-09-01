# 🏟️ Batal Academy Deployment Checklist

## Pre-deployment Checklist

- [ ] VPS access confirmed (31.97.216.38)
- [ ] Docker and Docker Compose installed on VPS
- [ ] Nginx installed on VPS
- [ ] Domain `batal.nabiljarrai.com` DNS configured
- [ ] SSH access to VPS working
- [ ] Git repository access confirmed

## Deployment Steps

- [ ] 1. Connect to VPS via SSH
- [ ] 2. Install/update dependencies (Docker, Docker Compose, Nginx, Git)
- [ ] 3. Clone repository to `/opt/batal`
- [ ] 4. Configure `.env` file with secure credentials
- [ ] 5. Update email in `deploy.sh` script
- [ ] 6. Run deployment script: `sudo bash deploy.sh`
- [ ] 7. Verify SSL certificate installation
- [ ] 8. Test application access

## Post-deployment Verification

- [ ] Frontend accessible at https://batal.nabiljarrai.com
- [ ] API responding at https://batal.nabiljarrai.com/api
- [ ] All Docker containers running
- [ ] SSL certificate valid
- [ ] Nginx configuration working
- [ ] Database accessible
- [ ] MinIO storage working

## Security Configuration

- [ ] Change default passwords in `.env`
- [ ] Update JWT secret key
- [ ] Configure email settings (if needed)
- [ ] Set up firewall rules
- [ ] Configure backup strategy

## Commands to Run on VPS

```bash
# Connect to VPS
ssh your-username@31.97.216.38

# Clone and deploy
sudo git clone https://github.com/NabilJarrai/batal.git /opt/batal
cd /opt/batal
sudo cp .env.prod .env
sudo nano .env  # Configure with your values
sudo bash deploy.sh

# Check status
sudo docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
sudo systemctl status nginx
```

## Quick Reference

- **Project Directory**: `/opt/batal`
- **Nginx Config**: `/etc/nginx/sites-available/batal`
- **SSL Certs**: `/etc/letsencrypt/live/batal.nabiljarrai.com/`
- **Logs**: `sudo docker-compose logs -f`
- **Update**: `sudo bash update.sh`
