package com.batal.exception;

import java.util.List;

public class ValidationException extends BaseException {
    
    private final List<String> validationErrors;
    
    public ValidationException(String message) {
        super(message);
        this.validationErrors = List.of(message);
    }
    
    public ValidationException(List<String> validationErrors) {
        super("Validation failed: " + String.join(", ", validationErrors));
        this.validationErrors = validationErrors;
    }
    
    public ValidationException(String field, String message) {
        super(String.format("Validation error for %s: %s", field, message));
        this.validationErrors = List.of(getMessage());
    }
    
    public List<String> getValidationErrors() {
        return validationErrors;
    }
    
    @Override
    protected String getDefaultErrorCode() {
        return "VALIDATION_ERROR";
    }
}