package com.batal.service;

import com.batal.entity.User;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Service for sending emails
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${batal.mail.from}")
    private String fromEmail;

    @Value("${batal.mail.from-name}")
    private String fromName;

    @Value("${batal.frontend.url}")
    private String frontendUrl;

    /**
     * Send password setup email to a new user
     */
    @Async
    public void sendPasswordSetupEmail(User user, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(new InternetAddress(fromEmail, fromName));
            helper.setTo(user.getEmail());
            helper.setSubject("Welcome to Batal Football Academy - Set Your Password");

            String setupLink = String.format("%s/setup-password?token=%s",
                    frontendUrl, token);

            String htmlContent = buildPasswordSetupEmailHtml(user, setupLink);
            helper.setText(htmlContent, true);

            mailSender.send(message);

            log.info("Password setup email sent successfully");
        } catch (Exception e) {
            log.error("Failed to send password setup email", e);
            throw new RuntimeException("Failed to send password setup email: " + e.getMessage(), e);
        }
    }

    /**
     * Build HTML content for password setup email
     */
    private String buildPasswordSetupEmailHtml(User user, String setupLink) {
        return String.format("""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Set Your Password</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f4f4f4;
                    }
                    .container {
                        max-width: 600px;
                        margin: 20px auto;
                        background: white;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                        color: white;
                        padding: 40px 30px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                    }
                    .content {
                        padding: 40px 30px;
                    }
                    .content p {
                        margin: 15px 0;
                        font-size: 16px;
                    }
                    .button {
                        display: inline-block;
                        padding: 15px 40px;
                        background: #667eea;
                        color: white !important;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        margin: 20px 0;
                        text-align: center;
                    }
                    .button:hover {
                        background: #5568d3;
                    }
                    .link-box {
                        background: #f9f9f9;
                        border: 1px solid #e0e0e0;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 20px 0;
                        word-break: break-all;
                        font-size: 14px;
                        color: #666;
                    }
                    .warning {
                        background: #fff3cd;
                        border-left: 4px solid #ffc107;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                    .warning strong {
                        color: #856404;
                    }
                    .footer {
                        background: #f4f4f4;
                        text-align: center;
                        padding: 20px;
                        font-size: 12px;
                        color: #666;
                    }
                    .footer p {
                        margin: 5px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⚽ Welcome to Batal Football Academy</h1>
                    </div>
                    <div class="content">
                        <p>Hello <strong>%s</strong>,</p>

                        <p>Your account has been created successfully! To get started and access your dashboard, you need to set your password.</p>

                        <p style="text-align: center;">
                            <a href="%s" class="button">Set Your Password</a>
                        </p>

                        <p>Or copy and paste this link into your browser:</p>
                        <div class="link-box">%s</div>

                        <div class="warning">
                            <strong>⏰ This link will expire in 48 hours</strong><br>
                            For security reasons, please set your password as soon as possible.
                        </div>

                        <p>If you didn't request this account or believe this email was sent in error, please contact the academy administrator immediately.</p>

                        <p>Best regards,<br>
                        <strong>Batal Football Academy Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message, please do not reply to this email.</p>
                        <p>© 2025 Batal Football Academy. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """, user.getFirstName(), setupLink, setupLink);
    }

    /**
     * Send password reset email to a user who forgot their password
     */
    @Async
    public void sendPasswordResetEmail(User user, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(new InternetAddress(fromEmail, fromName));
            helper.setTo(user.getEmail());
            helper.setSubject("Batal Football Academy - Password Reset Request");

            String resetLink = String.format("%s/reset-password?token=%s",
                    frontendUrl, token);

            String htmlContent = buildPasswordResetEmailHtml(user, resetLink);
            helper.setText(htmlContent, true);

            mailSender.send(message);

            log.info("Password reset email sent successfully");
        } catch (Exception e) {
            log.error("Failed to send password reset email", e);
            throw new RuntimeException("Failed to send password reset email: " + e.getMessage(), e);
        }
    }

    /**
     * Build HTML content for password reset email
     */
    private String buildPasswordResetEmailHtml(User user, String resetLink) {
        return String.format("""
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Your Password</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f4f4f4;
                    }
                    .container {
                        max-width: 600px;
                        margin: 20px auto;
                        background: white;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                        color: white;
                        padding: 40px 30px;
                        text-align: center;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                    }
                    .content {
                        padding: 40px 30px;
                    }
                    .content p {
                        margin: 15px 0;
                        font-size: 16px;
                    }
                    .button {
                        display: inline-block;
                        padding: 15px 40px;
                        background: #667eea;
                        color: white !important;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        margin: 20px 0;
                        text-align: center;
                    }
                    .button:hover {
                        background: #5568d3;
                    }
                    .link-box {
                        background: #f9f9f9;
                        border: 1px solid #e0e0e0;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 20px 0;
                        word-break: break-all;
                        font-size: 14px;
                        color: #666;
                    }
                    .warning {
                        background: #fff3cd;
                        border-left: 4px solid #ffc107;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                    .warning strong {
                        color: #856404;
                    }
                    .security-notice {
                        background: #e7f3ff;
                        border-left: 4px solid #2196F3;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                    .security-notice strong {
                        color: #0d47a1;
                    }
                    .footer {
                        background: #f4f4f4;
                        text-align: center;
                        padding: 20px;
                        font-size: 12px;
                        color: #666;
                    }
                    .footer p {
                        margin: 5px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Hello <strong>%s</strong>,</p>

                        <p>We received a request to reset the password for your Batal Football Academy account.</p>

                        <p style="text-align: center;">
                            <a href="%s" class="button">Reset Your Password</a>
                        </p>

                        <p>Or copy and paste this link into your browser:</p>
                        <div class="link-box">%s</div>

                        <div class="warning">
                            <strong>⏰ This link will expire in 48 hours</strong><br>
                            For security reasons, please reset your password as soon as possible.
                        </div>

                        <div class="security-notice">
                            <strong>🛡️ Didn't request this?</strong><br>
                            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                        </div>

                        <p>For security reasons, never share this link with anyone.</p>

                        <p>Best regards,<br>
                        <strong>Batal Football Academy Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message, please do not reply to this email.</p>
                        <p>© 2025 Batal Football Academy. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """, user.getFirstName(), resetLink, resetLink);
    }
}
