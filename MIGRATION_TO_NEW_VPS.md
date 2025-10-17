# Migration to New VPS and Domain

## Overview
- **Old Server**: (previous IP)
- **New Server**: `72.60.101.206`
- **Old Domain**: `batal.dev.nabiljarrai.com`
- **New Domain**: `batal-academy.com`

## ✅ Pre-Migration Checklist

### 1. DNS Configuration
- [ ] Point `batal-academy.com` A record to `72.60.101.206`
- [ ] Point `www.batal-academy.com` A record to `72.60.101.206`
- [ ] Wait for DNS propagation (5-60 minutes, check with `dig batal-academy.com`)

### 2. New Server Setup (72.60.101.206)

Run these commands on your new server:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl enable docker
sudo systemctl start docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo apt install -y nginx

# Install Certbot (for SSL)
sudo apt install -y certbot python3-certbot-nginx

# Install Git
sudo apt install -y git

# Configure firewall
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Create project directory
sudo mkdir -p /opt/batal-production
```

### 3. Generate SSH Key for GitHub Actions

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "github-actions@batal" -f ~/.ssh/github_actions -N ""

# Add public key to authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Display the PRIVATE key (you'll need to copy this)
echo "=========================================="
echo "COPY THIS PRIVATE KEY TO GITHUB SECRETS:"
echo "=========================================="
cat ~/.ssh/github_actions
echo "=========================================="

# Get your username
whoami
```

### 4. Update GitHub Secrets

Go to: `https://github.com/NabilJarrai/batal/settings/secrets/actions`

Update/Create these secrets:

#### Required Updates:
- **VPS_HOST**: `72.60.101.206`
- **VPS_USER**: `<your username from whoami command>`
- **VPS_SSH_KEY**: `<paste the entire private key from above>`

#### Verify These Exist:
- **POSTGRES_PASSWORD**: Database password
- **MINIO_ROOT_USER**: MinIO admin username
- **MINIO_ROOT_PASSWORD**: MinIO admin password
- **JWT_SECRET**: Long random string for JWT tokens
- **SPRING_MAIL_HOST**: SMTP host (e.g., smtp.ethereal.email)
- **SPRING_MAIL_PORT**: SMTP port (e.g., 587)
- **SPRING_MAIL_USERNAME**: Email username
- **SPRING_MAIL_PASSWORD**: Email password
- **ADMIN_EMAIL**: Your email for SSL certificate (e.g., admin@batal-academy.com)

## 🚀 Deployment Steps

### Step 1: Commit and Push Changes

The following files have been updated for the new domain:
- `.github/workflows/deploy.yml`
- `nginx-batal.conf`
- `docker-compose.deploy.yml`
- `deploy.sh`
- `backend/src/main/resources/application.properties`

```bash
# Commit the changes
git add .
git commit -m "chore: migrate to new VPS and domain batal-academy.com

- Update all configuration to use batal-academy.com
- Change deployment target to 72.60.101.206
- Update CORS origins for new domain
- Configure Nginx for www.batal-academy.com redirect"

# Push to your feature branch first
git push origin feature/assessment-management
```

### Step 2: Merge to Master Branch

```bash
# Switch to master
git checkout master

# Merge your feature branch
git merge feature/assessment-management

# Push to trigger deployment (this will trigger the GitHub Actions workflow)
git push origin master
```

### Step 3: Monitor Deployment

1. Go to GitHub Actions: `https://github.com/NabilJarrai/batal/actions`
2. Watch the deployment progress
3. Check for any errors in the workflow logs

### Step 4: Verify Deployment

On your new server, check the deployment:

```bash
# SSH to new server
ssh username@72.60.101.206

# Check Docker containers
cd /opt/batal-production
sudo docker-compose ps

# All containers should show "Up" status:
# - batal-frontend
# - batal-backend
# - batal-postgres
# - batal-minio

# Check logs if needed
sudo docker-compose logs -f backend
sudo docker-compose logs -f frontend

# Check Nginx status
sudo systemctl status nginx

# Verify SSL certificate
sudo certbot certificates
```

### Step 5: Test Application

1. **Frontend**: https://batal-academy.com
2. **Backend API**: https://batal-academy.com/api
3. **Test Login**: Try logging in with admin credentials
4. **Test All Features**:
   - User management
   - Player management
   - Group management
   - Assessments
   - File uploads

## 🔧 Troubleshooting

### Issue: DNS Not Propagated
```bash
# Check DNS resolution
dig batal-academy.com
nslookup batal-academy.com
```
**Solution**: Wait for DNS propagation (can take up to 48 hours but usually 5-60 minutes)

### Issue: Containers Not Starting
```bash
# Check container status
sudo docker-compose ps

# Check logs
sudo docker-compose logs backend
sudo docker-compose logs frontend

# Restart containers
sudo docker-compose down
sudo docker-compose up -d
```

### Issue: SSL Certificate Error
```bash
# Manually request certificate
sudo certbot --nginx -d batal-academy.com -d www.batal-academy.com

# Or force renewal
sudo certbot renew --force-renewal
```

### Issue: Nginx 502 Bad Gateway
```bash
# Check if backend is running
curl http://localhost:8080/api/actuator/health

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: Database Connection Error
```bash
# Check PostgreSQL container
sudo docker-compose logs postgres

# Verify database credentials in .env file
cat .env

# Restart PostgreSQL container
sudo docker-compose restart postgres
```

## 📊 Post-Migration Verification

- [ ] Website loads at https://batal-academy.com
- [ ] www redirect works: https://www.batal-academy.com → https://batal-academy.com
- [ ] SSL certificate is valid (green padlock in browser)
- [ ] Login functionality works
- [ ] API endpoints respond correctly
- [ ] File uploads work (MinIO)
- [ ] Database operations work
- [ ] Email notifications work
- [ ] All user roles can access their dashboards

## 🔄 Rollback Plan

If something goes wrong:

1. **Revert DNS**: Point domain back to old server
2. **Revert GitHub Secrets**: Change VPS_HOST back to old IP
3. **Revert Code**: 
   ```bash
   git revert HEAD
   git push origin develop
   ```

## 📝 Notes

- The project directory changed from `/opt/batal-dev` to `/opt/batal-production`
- Environment changed from `dev` to `production`
- Both root domain and www subdomain are supported
- SSL certificates will be automatically obtained via Let's Encrypt

## 🎉 Success Criteria

✅ All containers running successfully
✅ Application accessible via new domain
✅ SSL certificate installed and valid
✅ All features working correctly
✅ No errors in logs

---

**Important**: Keep this document updated as you make changes to your infrastructure!