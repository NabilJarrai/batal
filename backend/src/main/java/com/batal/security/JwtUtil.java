package com.batal.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    /** HS256 requires a key of at least 256 bits. */
    private static final int MIN_SECRET_BYTES = 32;

    /** Previously hardcoded in application.properties, so it is public in this repository's history. */
    private static final String COMPROMISED_SECRET =
            "batal-secret-key-change-in-production-make-it-very-long-and-secure";

    @Value("${batal.jwt.secret}")
    private String jwtSecret;

    @Value("${batal.jwt.expiration}")
    private long jwtExpirationMs;

    private SecretKey signingKey;

    /**
     * Validates the configured secret at startup so a misconfiguration fails loudly here
     * rather than silently signing tokens with a guessable key.
     */
    @PostConstruct
    void initSigningKey() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException(
                    "BATAL_JWT_SECRET is not set. Generate one with `openssl rand -base64 48` "
                            + "and provide it via the environment before starting the application.");
        }
        if (COMPROMISED_SECRET.equals(jwtSecret)) {
            throw new IllegalStateException(
                    "BATAL_JWT_SECRET is set to the value that was committed to this repository and is "
                            + "therefore public. Generate a replacement with `openssl rand -base64 48`.");
        }
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException("BATAL_JWT_SECRET must be at least " + MIN_SECRET_BYTES
                    + " bytes to sign with HS256, but the configured value is " + keyBytes.length + " bytes.");
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    private SecretKey getSigningKey() {
        return signingKey;
    }
    
    public String generateJwtToken(Authentication authentication) {
        Object principal = authentication.getPrincipal();

        // Safety check: ensure principal is UserDetails
        if (!(principal instanceof UserDetails)) {
            throw new IllegalStateException("Authentication principal is not a UserDetails instance");
        }

        UserDetails userPrincipal = (UserDetails) principal;

        Date expiryDate = new Date(System.currentTimeMillis() + jwtExpirationMs);

        return Jwts.builder()
                .setSubject(userPrincipal.getUsername())
                .setIssuedAt(new Date())
                .setExpiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }
    
    public String generateJwtToken(String email) {
        Date expiryDate = new Date(System.currentTimeMillis() + jwtExpirationMs);
        
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }
    
    public String getUsernameFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }
    
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(authToken);
            return true;
        } catch (io.jsonwebtoken.security.SignatureException e) {
            // Expected for tokens issued under a previous signing secret.
            System.err.println("JWT signature does not match: " + e.getMessage());
        } catch (MalformedJwtException e) {
            System.err.println("Invalid JWT token: " + e.getMessage());
        } catch (ExpiredJwtException e) {
            System.err.println("JWT token is expired: " + e.getMessage());
        } catch (UnsupportedJwtException e) {
            System.err.println("JWT token is unsupported: " + e.getMessage());
        } catch (JwtException e) {
            System.err.println("JWT token could not be validated: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            System.err.println("JWT claims string is empty: " + e.getMessage());
        }
        return false;
    }
    
    public Date getExpirationDateFromJwtToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getExpiration();
    }
    
    public boolean isTokenExpired(String token) {
        Date expiration = getExpirationDateFromJwtToken(token);
        return expiration.before(new Date());
    }
}
