package com.batal.event;

/**
 * Raised when a newly created account needs a password setup link.
 *
 * Published rather than sent inline so the email goes out only once the
 * account is actually committed, and so a mail failure cannot take the
 * account creation down with it.
 */
public class PasswordSetupEmailRequestedEvent {

    private final Long userId;

    public PasswordSetupEmailRequestedEvent(Long userId) {
        this.userId = userId;
    }

    public Long getUserId() {
        return userId;
    }
}
