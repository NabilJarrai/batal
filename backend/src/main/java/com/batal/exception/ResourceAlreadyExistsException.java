package com.batal.exception;

public class ResourceAlreadyExistsException extends BaseException {
    
    public ResourceAlreadyExistsException(String message) {
        super(message);
    }
    
    public ResourceAlreadyExistsException(String resource, String field, String value) {
        super(String.format("%s already exists with %s: %s", resource, field, value));
    }
    
    @Override
    protected String getDefaultErrorCode() {
        return "RESOURCE_ALREADY_EXISTS";
    }
}