package com.batal.repository;

import com.batal.entity.PasswordSetupToken;
import com.batal.entity.enums.TokenType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for managing password tokens (both setup and reset)
 */
@Repository
public interface PasswordSetupTokenRepository extends JpaRepository<PasswordSetupToken, Long> {

    /**
     * Find a token by its string value
     */
    Optional<PasswordSetupToken> findByToken(String token);

    /**
     * Find a token by its string value with user eagerly fetched
     * Use this when you need to access user properties to avoid LazyInitializationException
     */
    @Query("SELECT t FROM PasswordSetupToken t JOIN FETCH t.user WHERE t.token = :token")
    Optional<PasswordSetupToken> findByTokenWithUser(@Param("token") String token);

    /**
     * Find a token by its string value and type
     */
    Optional<PasswordSetupToken> findByTokenAndTokenType(String token, TokenType tokenType);

    /**
     * Find a token by its string value and type with user eagerly fetched
     * Use this when you need to access user properties to avoid LazyInitializationException
     */
    @Query("SELECT t FROM PasswordSetupToken t JOIN FETCH t.user WHERE t.token = :token AND t.tokenType = :tokenType")
    Optional<PasswordSetupToken> findByTokenAndTokenTypeWithUser(@Param("token") String token, @Param("tokenType") TokenType tokenType);

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
     * Invalidate all unused tokens of a specific type for a user by marking them as used
     */
    @Modifying
    @Query("UPDATE PasswordSetupToken t " +
           "SET t.usedAt = :now " +
           "WHERE t.user.id = :userId " +
           "AND t.tokenType = :tokenType " +
           "AND t.usedAt IS NULL")
    void invalidateAllUserTokensByType(@Param("userId") Long userId,
                                        @Param("tokenType") TokenType tokenType,
                                        @Param("now") LocalDateTime now);

    /**
     * Count unexpired tokens for a user
     */
    @Query("SELECT COUNT(t) FROM PasswordSetupToken t " +
           "WHERE t.user.id = :userId " +
           "AND t.expiresAt > :now")
    long countUnexpiredTokensByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * Check if a user has any valid tokens of a specific type
     */
    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END " +
           "FROM PasswordSetupToken t " +
           "WHERE t.user.id = :userId " +
           "AND t.tokenType = :tokenType " +
           "AND t.usedAt IS NULL " +
           "AND t.expiresAt > :now")
    boolean hasValidTokenByType(@Param("userId") Long userId,
                                 @Param("tokenType") TokenType tokenType,
                                 @Param("now") LocalDateTime now);
}
