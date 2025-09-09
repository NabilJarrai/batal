package com.batal.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    // ===== CUSTOM EXCEPTIONS =====
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(
            ResourceNotFoundException ex, HttpServletRequest request) {
        logger.warn("Resource not found: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Not Found",
            ex.getMessage(),
            ex.getErrorCode(),
            request.getRequestURI(),
            HttpStatus.NOT_FOUND.value()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(ResourceAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleResourceAlreadyExistsException(
            ResourceAlreadyExistsException ex, HttpServletRequest request) {
        logger.warn("Resource already exists: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Conflict",
            ex.getMessage(),
            ex.getErrorCode(),
            request.getRequestURI(),
            HttpStatus.CONFLICT.value()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            ValidationException ex, HttpServletRequest request) {
        logger.warn("Validation error: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Bad Request",
            ex.getMessage(),
            ex.getErrorCode(),
            request.getRequestURI(),
            HttpStatus.BAD_REQUEST.value(),
            ex.getValidationErrors()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(com.batal.exception.AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleCustomAccessDeniedException(
            com.batal.exception.AccessDeniedException ex, HttpServletRequest request) {
        logger.warn("Access denied: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Forbidden",
            ex.getMessage(),
            ex.getErrorCode(),
            request.getRequestURI(),
            HttpStatus.FORBIDDEN.value()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }
    
    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ErrorResponse> handleBusinessRuleException(
            BusinessRuleException ex, HttpServletRequest request) {
        logger.warn("Business rule violation: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Bad Request",
            ex.getMessage(),
            ex.getErrorCode(),
            request.getRequestURI(),
            HttpStatus.BAD_REQUEST.value()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(com.batal.exception.AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleCustomAuthenticationException(
            com.batal.exception.AuthenticationException ex, HttpServletRequest request) {
        logger.warn("Authentication failed: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Unauthorized",
            ex.getMessage(),
            ex.getErrorCode(),
            request.getRequestURI(),
            HttpStatus.UNAUTHORIZED.value()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }
    
    // ===== SPRING FRAMEWORK EXCEPTIONS =====
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        logger.warn("Validation failed: {}", ex.getMessage());
        
        List<String> validationErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.toList());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Bad Request",
            "Validation failed",
            "VALIDATION_ERROR",
            request.getRequestURI(),
            HttpStatus.BAD_REQUEST.value(),
            validationErrors
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest request) {
        logger.warn("Constraint violation: {}", ex.getMessage());
        
        List<String> validationErrors = ex.getConstraintViolations()
                .stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.toList());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Bad Request",
            "Validation failed",
            "CONSTRAINT_VIOLATION",
            request.getRequestURI(),
            HttpStatus.BAD_REQUEST.value(),
            validationErrors
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpServletRequest request) {
        logger.warn("Invalid request body: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Bad Request",
            "Invalid request body format",
            "INVALID_REQUEST_BODY",
            request.getRequestURI(),
            HttpStatus.BAD_REQUEST.value()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatch(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        logger.warn("Type mismatch: {}", ex.getMessage());
        
        String message = String.format("Invalid value '%s' for parameter '%s'. Expected type: %s", 
            ex.getValue(), ex.getName(), ex.getRequiredType().getSimpleName());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Bad Request",
            message,
            "TYPE_MISMATCH",
            request.getRequestURI(),
            HttpStatus.BAD_REQUEST.value()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingServletRequestParameter(
            MissingServletRequestParameterException ex, HttpServletRequest request) {
        logger.warn("Missing request parameter: {}", ex.getMessage());
        
        String message = String.format("Required parameter '%s' is missing", ex.getParameterName());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Bad Request",
            message,
            "MISSING_PARAMETER",
            request.getRequestURI(),
            HttpStatus.BAD_REQUEST.value()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }
    
    // ===== SPRING SECURITY EXCEPTIONS =====
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(
            AccessDeniedException ex, HttpServletRequest request) {
        logger.warn("Spring Security access denied: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Forbidden",
            "Access denied. You don't have permission to perform this operation",
            "ACCESS_DENIED",
            request.getRequestURI(),
            HttpStatus.FORBIDDEN.value()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }
    
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(
            AuthenticationException ex, HttpServletRequest request) {
        logger.warn("Spring Security authentication failed: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Unauthorized",
            "Authentication failed. Please check your credentials",
            "AUTHENTICATION_FAILED",
            request.getRequestURI(),
            HttpStatus.UNAUTHORIZED.value()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }
    
    // ===== HTTP AND WEB EXCEPTIONS =====
    
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleHttpRequestMethodNotSupported(
            HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        logger.warn("Method not supported: {}", ex.getMessage());
        
        String message = String.format("Request method '%s' not supported. Supported methods: %s", 
            ex.getMethod(), String.join(", ", ex.getSupportedMethods()));
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Method Not Allowed",
            message,
            "METHOD_NOT_SUPPORTED",
            request.getRequestURI(),
            HttpStatus.METHOD_NOT_ALLOWED.value()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.METHOD_NOT_ALLOWED);
    }
    
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleHttpMediaTypeNotSupported(
            HttpMediaTypeNotSupportedException ex, HttpServletRequest request) {
        logger.warn("Media type not supported: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Unsupported Media Type",
            "Content type not supported: " + ex.getContentType(),
            "UNSUPPORTED_MEDIA_TYPE",
            request.getRequestURI(),
            HttpStatus.UNSUPPORTED_MEDIA_TYPE.value()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
    }
    
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(
            NoResourceFoundException ex, HttpServletRequest request) {
        logger.warn("No resource found: {}", ex.getMessage());
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Not Found",
            "The requested resource was not found",
            "RESOURCE_NOT_FOUND",
            request.getRequestURI(),
            HttpStatus.NOT_FOUND.value()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }
    
    // ===== DATABASE EXCEPTIONS =====
    
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
            DataIntegrityViolationException ex, HttpServletRequest request) {
        logger.error("Data integrity violation: {}", ex.getMessage());
        
        String userMessage = "A data integrity constraint was violated. Please check your input data.";
        if (ex.getMessage().contains("unique") || ex.getMessage().contains("UNIQUE")) {
            userMessage = "A record with this information already exists.";
        } else if (ex.getMessage().contains("foreign key") || ex.getMessage().contains("FOREIGN KEY")) {
            userMessage = "Cannot perform this operation due to related data constraints.";
        }
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Conflict",
            userMessage,
            "DATA_INTEGRITY_VIOLATION",
            request.getRequestURI(),
            HttpStatus.CONFLICT.value()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }
    
    // ===== FALLBACK FOR ALL OTHER EXCEPTIONS =====
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex, HttpServletRequest request) {
        logger.error("Unhandled exception occurred", ex);
        
        ErrorResponse errorResponse = new ErrorResponse(
            "Internal Server Error",
            "An unexpected error occurred. Please try again later.",
            "INTERNAL_SERVER_ERROR",
            request.getRequestURI(),
            HttpStatus.INTERNAL_SERVER_ERROR.value()
        );
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}