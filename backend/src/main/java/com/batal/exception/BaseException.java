package com.batal.exception;

public abstract class BaseException extends RuntimeException {
    
    private final String errorCode;
    
    public BaseException(String message) {
        super(message);
        this.errorCode = getDefaultErrorCode();
    }
    
    public BaseException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = getDefaultErrorCode();
    }
    
    public BaseException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public BaseException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
    
    protected abstract String getDefaultErrorCode();
}