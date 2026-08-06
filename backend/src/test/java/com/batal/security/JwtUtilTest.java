package com.batal.security;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtUtilTest {

    private static final String VALID_SECRET = "a-test-secret-that-is-long-enough-for-hs256-signing";

    private JwtUtil jwtUtilWithSecret(String secret) {
        JwtUtil jwtUtil = new JwtUtil();
        ReflectionTestUtils.setField(jwtUtil, "jwtSecret", secret);
        ReflectionTestUtils.setField(jwtUtil, "jwtExpirationMs", 28800000L);
        return jwtUtil;
    }

    @Test
    void refusesToStartWhenSecretIsMissing() {
        JwtUtil jwtUtil = jwtUtilWithSecret("");

        IllegalStateException thrown = assertThrows(IllegalStateException.class, jwtUtil::initSigningKey);
        assertTrue(thrown.getMessage().contains("BATAL_JWT_SECRET is not set"));
    }

    @Test
    void refusesToStartWhenSecretIsTheOneCommittedToTheRepository() {
        JwtUtil jwtUtil = jwtUtilWithSecret("batal-secret-key-change-in-production-make-it-very-long-and-secure");

        IllegalStateException thrown = assertThrows(IllegalStateException.class, jwtUtil::initSigningKey);
        assertTrue(thrown.getMessage().contains("public"));
    }

    @Test
    void refusesToStartWhenSecretIsTooShortForHs256() {
        JwtUtil jwtUtil = jwtUtilWithSecret("too-short-for-hs256");

        IllegalStateException thrown = assertThrows(IllegalStateException.class, jwtUtil::initSigningKey);
        assertTrue(thrown.getMessage().contains("at least 32 bytes"));
    }

    @Test
    void signsAndReadsBackATokenWithAValidSecret() {
        JwtUtil jwtUtil = jwtUtilWithSecret(VALID_SECRET);
        jwtUtil.initSigningKey();

        String token = jwtUtil.generateJwtToken("coach@batal-academy.com");

        assertNotNull(token);
        assertTrue(jwtUtil.validateJwtToken(token));
        assertEquals("coach@batal-academy.com", jwtUtil.getUsernameFromJwtToken(token));
    }

    @Test
    void rejectsATokenSignedWithADifferentSecret() {
        JwtUtil issuer = jwtUtilWithSecret(VALID_SECRET);
        issuer.initSigningKey();
        JwtUtil verifier = jwtUtilWithSecret("a-completely-different-secret-of-sufficient-length");
        verifier.initSigningKey();

        String token = issuer.generateJwtToken("coach@batal-academy.com");

        assertTrue(!verifier.validateJwtToken(token));
    }
}
