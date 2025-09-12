package com.batal.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.FORBIDDEN)
public class SelfDeletionException extends RuntimeException {
    
    public SelfDeletionException() {
        super("Cannot delete your own account");
    }
    
    public SelfDeletionException(String message) {
        super(message);
    }
}