package com.batal.service;

import com.batal.config.WelcomeEmailExecutorConfig;
import com.batal.dto.BulkWelcomeEmailResponse;
import com.batal.entity.User;
import com.batal.entity.enums.UserType;
import com.batal.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

/**
 * Sends email to a selected set of parents in bulk.
 *
 * Two sends live here because they share everything that is awkward: the
 * eligibility rules, the background thread, and the "some of them will fail"
 * reporting.
 *
 * - Welcome emails carry the password setup link. This is how accounts created
 *   while welcome emails were paused eventually get invited: the admin waits
 *   until the academy has something worth logging in to see, selects the
 *   parents, and sends the whole intake at once.
 * - Password resets are for parents who already onboarded and are locked out.
 *
 * The two are mutually exclusive by definition - setting a password is exactly
 * what moves a parent from one group to the other - so each send skips the
 * parents belonging to the other.
 */
@Service
public class ParentBulkEmailService {

    private static final Logger log = LoggerFactory.getLogger(ParentBulkEmailService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthService authService;

    @Autowired
    @Qualifier(WelcomeEmailExecutorConfig.WELCOME_EMAIL_EXECUTOR)
    private ThreadPoolTaskExecutor welcomeEmailExecutor;

    /**
     * Work out who can actually be mailed, then hand the sending to a
     * background thread.
     *
     * Delivery is not awaited on purpose. Mail is sent synchronously by
     * EmailService, one SMTP round trip per recipient with a five second
     * timeout each, so a hundred parents could hold an HTTP request open for
     * minutes and time out behind the proxy - having sent some unknown prefix
     * of the list. Returning as soon as the work is accepted keeps the request
     * fast, and the result is visible in the parents list either way: a
     * successful send stamps the parent as invited, and a failed one leaves
     * them awaiting an invitation so the admin can just select them again.
     */
    @Transactional(readOnly = true)
    public BulkWelcomeEmailResponse sendWelcomeEmails(List<Long> userIds) {
        // Already onboarded parents are skipped: re-sending would invite
        // someone who is already using the system. They want a reset instead.
        return dispatch(userIds, "Welcome email",
                user -> user.getPasswordSetAt() != null ? "Already set their password" : null,
                authService::issuePasswordSetupLink);
    }

    /**
     * Send a password reset link to parents who are locked out.
     *
     * The mirror image of the welcome send: this one is for parents who already
     * set a password, so anyone who has not yet is skipped - a reset link would
     * be useless to them, and the welcome email is what they actually need.
     */
    @Transactional(readOnly = true)
    public BulkWelcomeEmailResponse sendPasswordResets(List<Long> userIds) {
        return dispatch(userIds, "Password reset",
                user -> user.getPasswordSetAt() == null
                        ? "Has not set a password yet - send the welcome email instead"
                        : null,
                authService::issuePasswordResetLink);
    }

    /**
     * Decide who is eligible, then hand the sending to a background thread.
     *
     * @param extraSkipReason returns why this parent is ineligible, or null if they are fine
     * @param send            issues the link for one user; false means the mail did not go out
     */
    private BulkWelcomeEmailResponse dispatch(
            List<Long> userIds,
            String kind,
            java.util.function.Function<User, String> extraSkipReason,
            java.util.function.Predicate<Long> send) {

        // The same parent selected twice must not be mailed twice.
        List<Long> uniqueIds = new ArrayList<>(new LinkedHashSet<>(userIds));

        List<Long> toSend = new ArrayList<>();
        List<BulkWelcomeEmailResponse.SkippedRecipient> skipped = new ArrayList<>();

        for (Long userId : uniqueIds) {
            User user = userRepository.findById(userId).orElse(null);

            if (user == null) {
                skipped.add(new BulkWelcomeEmailResponse.SkippedRecipient(
                        userId, "Unknown user", "This account no longer exists"));
                continue;
            }

            String name = user.getFullName();

            if (user.getUserType() != UserType.PARENT) {
                skipped.add(new BulkWelcomeEmailResponse.SkippedRecipient(
                        userId, name, "Not a parent account"));
                continue;
            }

            String reason = extraSkipReason.apply(user);
            if (reason != null) {
                skipped.add(new BulkWelcomeEmailResponse.SkippedRecipient(userId, name, reason));
                continue;
            }

            toSend.add(userId);
        }

        if (!toSend.isEmpty()) {
            welcomeEmailExecutor.execute(() -> deliver(toSend, kind, send));
        }

        return new BulkWelcomeEmailResponse(toSend.size(), skipped);
    }

    /**
     * Runs off the request thread. Each recipient is sent independently so one
     * bad address cannot stop the rest of the run.
     */
    private void deliver(List<Long> userIds, String kind, java.util.function.Predicate<Long> send) {
        int sent = 0;
        int failed = 0;

        for (Long userId : userIds) {
            try {
                // Each send opens its own transaction and swallows a delivery
                // failure rather than poisoning it, returning false instead.
                if (send.test(userId)) {
                    sent++;
                } else {
                    failed++;
                    log.error("{} to user {} was not delivered. The account and its link are "
                            + "fine, and the parent can be selected again.", kind, userId);
                }
            } catch (Exception e) {
                failed++;
                log.error("{} to user {} failed. The parent can be selected again.",
                        kind, userId, e);
            }
        }

        log.info("Bulk {} run finished: {} sent, {} failed, {} requested",
                kind.toLowerCase(), sent, failed, userIds.size());
    }

    /** Parents who have an account but have never been sent their setup link. */
    @Transactional(readOnly = true)
    public long countAwaitingWelcomeEmail() {
        return userRepository.countParentsAwaitingWelcomeEmail();
    }

    /** Ids of every parent still awaiting an invitation, for "select all". */
    @Transactional(readOnly = true)
    public List<Long> findIdsAwaitingWelcomeEmail() {
        return userRepository.findParentsAwaitingWelcomeEmail().stream()
                .map(User::getId)
                .toList();
    }
}
