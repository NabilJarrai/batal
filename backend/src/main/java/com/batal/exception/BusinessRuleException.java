package com.batal.exception;

public class BusinessRuleException extends BaseException {
    
    public BusinessRuleException(String message) {
        super(message);
    }
    
    public BusinessRuleException(String rule, String details) {
        super(String.format("Business rule violation: %s - %s", rule, details));
    }
    
    @Override
    protected String getDefaultErrorCode() {
        return "BUSINESS_RULE_VIOLATION";
    }
}