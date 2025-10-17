package com.batal.repository;

import com.batal.entity.PasswordSetupToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for managing password setup tokens
 */
@Repository
public interface PasswordSetupTokenRepository extends JpaRepository<PasswordSetupToken, Long> {

    /**
     * Find a token by its string value
     */
    Optional<PasswordSetupToken> findByToken(String token);

    /**
     * Find an unused token for a specific user
     */
    Optional<PasswordSetupToken> findByUserIdAndUsedAtIsNull(Long userId);

    /**
     * Find all tokens for a user, ordered by creation date (newest first)
     */
    List<PasswordSetupToken> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Check if a user has any valid (unused and not expired) tokens
     */
    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END " +
           "FROM PasswordSetupToken t " +
           "WHERE t.user.id = :userId " +
           "AND t.usedAt IS NULL " +
           "AND t.expiresAt > :now")
    boolean hasValidToken(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * Delete all expired tokens (cleanup job)
     */
    @Modifying
    @Query("DELETE FROM PasswordSetupToken t WHERE t.expiresAt < :date")
    void deleteExpiredTokens(@Param("date") LocalDateTime date);

    /**
     * Invalidate all unused tokens for a user by marking them as used
     */
    @Modifying
    @Query("UPDATE PasswordSetupToken t " +
           "SET t.usedAt = :now " +
           "WHERE t.user.id = :userId " +
           "AND t.usedAt IS NULL")
    void invalidateAllUserTokens(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * Count unexpired tokens for a user
     */
    @Query("SELECT COUNT(t) FROM PasswordSetupToken t " +
           "WHERE t.user.id = :userId " +
           "AND t.expiresAt > :now")
    long countUnexpiredTokensByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}
