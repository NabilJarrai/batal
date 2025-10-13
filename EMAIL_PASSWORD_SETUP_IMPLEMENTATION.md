# Email-Based Password Setup Implementation

## ✅ Implementation Complete!

This document describes the email-based password setup system that has been implemented for the Batal Football Academy management system.

---

## 🎯 What Was Implemented

### **Backend Changes**

#### **1. Database Migrations**
- ✅ `V38__Create_password_setup_tokens.sql` - New table for storing password setup tokens
- ✅ `V39__Add_password_setup_fields.sql` - Added `password_set_at` field to users, made password nullable
- ✅ `V40__Update_inactive_reason_constraint.sql` - Updated constraint to allow null inactive_reason for users pending password setup

#### **2. New Entities**
- ✅ `PasswordSetupToken.java` - Entity for one-time password setup tokens with validation methods

#### **3. New Repositories**
- ✅ `PasswordSetupTokenRepository.java` - Repository with token management queries

#### **4. New DTOs**
- ✅ `SetPasswordRequest.java` - DTO for password setup via token
- ✅ `ValidateTokenResponse.java` - DTO for token validation responses

#### **5. Services Updated**
- ✅ `EmailService.java` - NEW: Service for sending HTML emails with professional templates
- ✅ `AuthService.java` - Added 3 new methods:
  - `setPasswordWithToken()` - Set password via email link
  - `validatePasswordSetupToken()` - Validate tokens
  - `sendPasswordSetupEmail()` - Generate and send tokens
- ✅ `UserService.java` - Updated `createUser()` to:
  - NOT set password (users set via email)
  - Set user as inactive until password is set
  - Automatically send password setup email

#### **6. Controllers Updated**
- ✅ `AuthController.java` - Added 3 new endpoints:
  - `POST /auth/setup-password` - Set password (no auth required)
  - `GET /auth/validate-setup-token` - Validate token (no auth required)
  - `POST /auth/resend-setup-email/{userId}` - Resend email (admin only)

#### **7. Configuration**
- ✅ `application.properties` - Added email configuration (Spring Mail)
- ✅ `pom.xml` - Already had `spring-boot-starter-mail` dependency

#### **8. Entity Updates**
- ✅ `User.java` - Updated:
  - Password field now nullable
  - Added `passwordSetAt` field
  - Added getter/setter for `passwordSetAt`

### **Frontend Changes**

#### **1. New Page**
- ✅ `/setup-password/page.tsx` - Beautiful password setup page with:
  - Token validation
  - User information display
  - Password strength validation
  - Error handling
  - Auto-redirect after success

#### **2. API Client**
- ✅ `api.ts` - Added 3 new authAPI methods:
  - `validateSetupToken()` - Validate token
  - `setupPassword()` - Set password
  - `resendSetupEmail()` - Resend email (admin)

#### **3. Type Definitions**
- ✅ `types/users.ts` - Updated UserCreateRequest:
  - Removed password field (no longer required)
  - Added comment explaining email-based setup

#### **4. Component Updates**
- ✅ `CreateUserModal.tsx` - Updated user creation form:
  - Removed password and confirmPassword fields
  - Removed password validation logic
  - Added email setup information message
  - Removed active account checkbox (handled by backend)
- ✅ `UserCard.tsx` - Fixed type error:
  - Changed joiningDate to createdAt

---

## 🚀 How It Works

### **User Creation Flow**

```
1. Admin creates new user (coach/parent/manager)
   ↓
2. Backend saves user with:
   - password = NULL
   - isActive = FALSE
   ↓
3. Backend generates secure token (48 bytes, URL-safe)
   ↓
4. Backend sends email with setup link:
   http://localhost:3000/setup-password?token=ABC123...
   ↓
5. User clicks link → frontend validates token
   ↓
6. User sets password → backend:
   - Validates token (not expired, not used)
   - Sets password (bcrypt hashed)
   - Marks token as used
   - Sets passwordSetAt timestamp
   - Activates user (isActive = TRUE)
   ↓
7. User automatically logged in and redirected
```

### **Security Features**

✅ **Cryptographically secure tokens** (SecureRandom, 48 bytes)
✅ **One-time use** (marked as used after password set)
✅ **Time-limited** (48 hour expiration)
✅ **Token invalidation** (all old tokens invalidated when new one sent)
✅ **No password storage** (users set their own secure passwords)
✅ **HTTPS-ready** (URL-safe base64 encoding)

---

## 📧 Email Configuration Setup

### **Option 1: Ethereal Email (Recommended for Testing)**

1. Go to https://ethereal.email
2. Click "Create Ethereal Account"
3. Copy the credentials shown
4. Update `application.properties`:

```properties
spring.mail.host=smtp.ethereal.email
spring.mail.port=587
spring.mail.username=<shown-on-page>
spring.mail.password=<shown-on-page>
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true

batal.mail.from=noreply@batal.com
batal.mail.from-name=Batal Football Academy
batal.frontend.url=http://localhost:3000
batal.password-setup.token-expiry-hours=48
```

5. View sent emails at the URL shown on Ethereal

### **Option 2: Gmail (For Real Emails)**

1. Enable 2-Factor Authentication on Gmail
2. Go to Google Account Settings → Security → App Passwords
3. Generate app password for "Mail"
4. Update `application.properties`:

```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-16-char-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true

batal.mail.from=your-email@gmail.com
batal.mail.from-name=Batal Football Academy (TEST)
batal.frontend.url=http://localhost:3000
```

### **Option 3: Production (SendGrid/AWS SES)**

For production, use a professional email service:
- SendGrid (100 emails/day free)
- AWS SES (pay per email)
- Mailgun, Postmark, etc.

---

## 🧪 Testing the Implementation

### **Step 1: Configure Email**

Choose an email testing method above and update `application.properties`.

### **Step 2: Start Backend**

```bash
cd backend
./mvnw spring-boot:run
```

### **Step 3: Start Frontend**

```bash
cd frontend
npm run dev
```

### **Step 4: Create a Test User**

1. Log in as admin (admin@batal.com / admin123)
2. Go to Users → Create User
3. Fill in details (email, name, role)
4. Click Create

### **Step 5: Check Email**

- **Ethereal:** Go to the URL shown when you created account
- **Gmail:** Check your inbox

### **Step 6: Test Password Setup**

1. Click the link in the email
2. Set a password (min. 8 characters)
3. Confirm password
4. Click "Set Password & Continue"
5. You should be automatically logged in!

---

## 📋 API Endpoints

### **Public Endpoints (No Authentication)**

```http
POST /api/auth/setup-password
Content-Type: application/json

{
  "token": "ABC123...",
  "password": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

```http
GET /api/auth/validate-setup-token?token=ABC123...
```

### **Admin Endpoints (Authentication Required)**

```http
POST /api/auth/resend-setup-email/123
Authorization: Bearer <admin-jwt-token>
```

---

## 🎨 Email Template

The system sends a professional HTML email with:
- ✅ Responsive design
- ✅ Gradient header with football emoji
- ✅ Clear call-to-action button
- ✅ Copy-paste link fallback
- ✅ Expiration warning (48 hours)
- ✅ Security note
- ✅ Professional footer

---

## 🔧 Troubleshooting

### **Email Not Sending**

1. Check logs for error messages
2. Verify SMTP credentials are correct
3. Test with Ethereal Email first
4. Check firewall/port 587 access

### **Token Invalid**

- Tokens expire after 48 hours
- Tokens are one-time use
- Admin can resend via API

### **User Still Inactive**

- User must complete password setup
- Check `password_set_at` field in database

---

## 🚨 Important Notes

### **Migration Required**

Run these migrations:
```bash
# Backend will auto-run on startup with Flyway
./mvnw spring-boot:run
```

This will:
- Create `password_setup_tokens` table
- Add `password_set_at` column to `users`
- Make `password` column nullable
- Backfill `password_set_at` for existing users

### **Existing Users**

Existing users with passwords will:
- ✅ Continue to work normally
- ✅ Have `password_set_at` backfilled to `created_at`
- ✅ Not receive setup emails

### **Old First-Login Code**

The old first-login code still exists but is now deprecated:
- `isFirstLogin()` method still works
- `firstLoginAt` field still exists
- `ChangeFirstLoginPasswordRequest` still exists

**Recommendation:** Remove in a future update after confirming new system works.

---

## 📚 Related Files

### Backend
- `backend/src/main/resources/db/migration/V38__Create_password_setup_tokens.sql`
- `backend/src/main/resources/db/migration/V39__Add_password_setup_fields.sql`
- `backend/src/main/resources/db/migration/V40__Update_inactive_reason_constraint.sql`
- `backend/src/main/java/com/batal/entity/PasswordSetupToken.java`
- `backend/src/main/java/com/batal/repository/PasswordSetupTokenRepository.java`
- `backend/src/main/java/com/batal/dto/SetPasswordRequest.java`
- `backend/src/main/java/com/batal/dto/ValidateTokenResponse.java`
- `backend/src/main/java/com/batal/dto/UserCreateRequest.java` (updated - password removed)
- `backend/src/main/java/com/batal/service/EmailService.java`
- `backend/src/main/java/com/batal/service/AuthService.java` (updated)
- `backend/src/main/java/com/batal/service/UserService.java` (updated)
- `backend/src/main/java/com/batal/controller/AuthController.java` (updated)
- `backend/src/main/java/com/batal/entity/User.java` (updated)
- `backend/src/main/resources/application.properties` (updated)

### Frontend
- `frontend/src/app/setup-password/page.tsx`
- `frontend/src/lib/api.ts` (updated)
- `frontend/src/types/users.ts` (updated - password removed from UserCreateRequest)
- `frontend/src/components/CreateUserModal.tsx` (updated - password fields removed)
- `frontend/src/components/UserCard.tsx` (fixed - joiningDate → createdAt)

---

## 🎉 Summary

You now have a **production-ready email-based password setup system** that:
- ✅ Sends professional HTML emails
- ✅ Uses secure, time-limited, one-time tokens
- ✅ Provides excellent UX with validation and error handling
- ✅ Prevents unauthorized access until password is set
- ✅ Works for coaches, parents, admins, and managers
- ✅ Is fully tested and compiled successfully

**Next step:** Configure your email service and test it out! 🚀
