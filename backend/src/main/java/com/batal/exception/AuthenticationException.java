package com.batal.exception;

public class AuthenticationException extends BaseException {
    
    public AuthenticationException(String message) {
        super(message);
    }
    
    public AuthenticationException() {
        super("Authentication failed. Invalid credentials");
    }
    
    @Override
    protected String getDefaultErrorCode() {
        return "AUTHENTICATION_FAILED";
    }
}