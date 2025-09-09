package com.batal.exception;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    
    private String error;
    private String message;
    private String errorCode;
    private String path;
    private int status;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime timestamp;
    
    private List<String> validationErrors;
    
    public ErrorResponse() {
        this.timestamp = LocalDateTime.now();
    }
    
    public ErrorResponse(String error, String message, int status) {
        this();
        this.error = error;
        this.message = message;
        this.status = status;
    }
    
    public ErrorResponse(String error, String message, String errorCode, int status) {
        this(error, message, status);
        this.errorCode = errorCode;
    }
    
    public ErrorResponse(String error, String message, String errorCode, String path, int status) {
        this(error, message, errorCode, status);
        this.path = path;
    }
    
    public ErrorResponse(String error, String message, String errorCode, String path, int status, List<String> validationErrors) {
        this(error, message, errorCode, path, status);
        this.validationErrors = validationErrors;
    }
    
    // Getters and setters
    public String getError() {
        return error;
    }
    
    public void setError(String error) {
        this.error = error;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
    
    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }
    
    public String getPath() {
        return path;
    }
    
    public void setPath(String path) {
        this.path = path;
    }
    
    public int getStatus() {
        return status;
    }
    
    public void setStatus(int status) {
        this.status = status;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    public List<String> getValidationErrors() {
        return validationErrors;
    }
    
    public void setValidationErrors(List<String> validationErrors) {
        this.validationErrors = validationErrors;
    }
}