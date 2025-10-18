package com.batal.entity;

import com.batal.entity.enums.TokenType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entity representing a one-time password token sent via email.
 * Used for both secure password initialization for new users (SETUP)
 * and password reset for existing users (RESET).
 */
@Entity
@Table(name = "password_tokens")
@Getter
@Setter
@NoArgsConstructor
public class PasswordSetupToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true, length = 255)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(name = "token_type", nullable = false, length = 10)
    private TokenType tokenType = TokenType.SETUP;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "used_at")
    private LocalDateTime usedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    /**
     * Check if the token has expired
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * Check if the token has been used
     */
    public boolean isUsed() {
        return usedAt != null;
    }

    /**
     * Check if the token is valid (not expired and not used)
     */
    public boolean isValid() {
        return !isExpired() && !isUsed();
    }

    /**
     * Mark this token as used
     */
    public void markAsUsed() {
        this.usedAt = LocalDateTime.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PasswordSetupToken)) return false;
        PasswordSetupToken that = (PasswordSetupToken) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }

    @Override
    public String toString() {
        return "PasswordSetupToken{" +
                "id=" + id +
                ", userId=" + (user != null ? user.getId() : null) +
                ", tokenType=" + tokenType +
                ", expiresAt=" + expiresAt +
                ", isUsed=" + isUsed() +
                ", isExpired=" + isExpired() +
                '}';
    }
}
