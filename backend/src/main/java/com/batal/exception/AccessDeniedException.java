package com.batal.exception;

public class AccessDeniedException extends BaseException {
    
    public AccessDeniedException(String message) {
        super(message);
    }
    
    public AccessDeniedException() {
        super("Access denied. You don't have permission to perform this operation");
    }
    
    public AccessDeniedException(String operation, String resource) {
        super(String.format("Access denied. You don't have permission to %s %s", operation, resource));
    }
    
    @Override
    protected String getDefaultErrorCode() {
        return "ACCESS_DENIED";
    }
}