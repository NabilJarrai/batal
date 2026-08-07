package com.batal.event;

import com.batal.service.AuthService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Sends the password setup email once the account that needs it has committed.
 *
 * EmailService rethrows delivery failures as RuntimeException, and
 * AuthService.sendPasswordSetupEmail is transactional. Called inline from
 * another transactional method, a dead SMTP server therefore marks the shared
 * transaction rollback-only and the caller's try/catch cannot save it - the
 * commit fails with UnexpectedRollbackException and the account is lost.
 *
 * Running after commit in its own transaction keeps the two apart: the account
 * is already durable, and a mail failure only costs the setup token, which an
 * admin can reissue with "Resend password setup email".
 */
@Component
public class PasswordSetupEmailListener {

    private static final Logger log = LoggerFactory.getLogger(PasswordSetupEmailListener.class);

    @Autowired
    private AuthService authService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onPasswordSetupEmailRequested(PasswordSetupEmailRequestedEvent event) {
        try {
            authService.sendPasswordSetupEmail(event.getUserId());
        } catch (Exception e) {
            log.error("Failed to send password setup email to user {}. "
                    + "The account was created; an admin can resend the link.",
                    event.getUserId(), e);
        }
    }
}
