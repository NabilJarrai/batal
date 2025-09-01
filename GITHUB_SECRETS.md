# 🔐 GitHub Secrets Configuration

To deploy the Batal Academy using GitHub Actions, you need to configure the following secrets in your GitHub repository.

## How to Add Secrets

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Click on **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret below

## Required Secrets

### VPS Connection
```
VPS_HOST = 31.97.216.38
VPS_USER = your_vps_username
VPS_SSH_KEY = your_private_ssh_key_content
```

### Database Configuration
```
POSTGRES_PASSWORD = your_secure_postgres_password
```

### MinIO Storage Configuration
```
MINIO_ROOT_USER = admin
MINIO_ROOT_PASSWORD = your_secure_minio_password
```

### JWT Security
```
JWT_SECRET = your_very_long_jwt_secret_key_at_least_32_characters_long
```

### Email Configuration (Optional)
```
SPRING_MAIL_HOST = smtp.gmail.com
SPRING_MAIL_PORT = 587
SPRING_MAIL_USERNAME = your_email@gmail.com
SPRING_MAIL_PASSWORD = your_app_password
```

### Admin Configuration
```
ADMIN_EMAIL = your_email@example.com
```

## SSH Key Setup

### 1. Generate SSH Key (if you don't have one)
```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
```

### 2. Copy Public Key to VPS
```bash
ssh-copy-id your_username@31.97.216.38
```

### 3. Add Private Key to GitHub Secrets
Copy the content of your private key (usually `~/.ssh/id_rsa`) and add it as `VPS_SSH_KEY` secret.

## Deployment Process

1. **Initial Setup**: Run the `deploy.sh` script once on your VPS to set up the environment
2. **Configure Secrets**: Add all required secrets to your GitHub repository
3. **Deploy**: Push to main/master branch to trigger automatic deployment

## Security Best Practices

- Use strong, unique passwords for all secrets
- Never commit secrets to your repository
- Regularly rotate your secrets
- Use App Passwords for email services (not your main password)
- Keep your SSH keys secure and don't share them

## Testing Secrets

After adding secrets, you can test the deployment by:
1. Making a small change to your code
2. Pushing to the main/master branch
3. Checking the GitHub Actions tab for the deployment status

## Example Values (DO NOT USE THESE IN PRODUCTION)

```
POSTGRES_PASSWORD = MySecurePassword123!
MINIO_ROOT_USER = admin
MINIO_ROOT_PASSWORD = MySecureMinIOPassword456!
JWT_SECRET = ThisIsAVeryLongJWTSecretKeyForProductionUseOnly12345
```

Remember to replace these with your own secure values!
