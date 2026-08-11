package com.batal.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.ThreadPoolExecutor;

/**
 * The thread a bulk welcome email run happens on.
 *
 * Deliberately NOT driven by {@code @EnableAsync}. EmailService already carries
 * {@code @Async} annotations that are inert because nothing enables async
 * anywhere in this application, and AuthService.issuePasswordSetupLink depends
 * on that: it catches a delivery failure and returns false so the caller can
 * log it and leave the token valid for a resend. Switching async on globally
 * would move those failures onto another thread, the catch would stop being
 * reachable, and every send would silently report success while marking the
 * recipient as invited. So this executor is injected and used directly, and
 * mail delivery stays synchronous on whatever thread calls it.
 */
@Configuration
public class WelcomeEmailExecutorConfig {

    public static final String WELCOME_EMAIL_EXECUTOR = "welcomeEmailExecutor";

    /**
     * One thread, so an intake's worth of mail goes out in sequence rather than
     * opening a fistful of simultaneous SMTP connections. Each queued task is a
     * whole run - one admin click - so the queue only needs to be deep enough
     * to absorb impatient repeat clicks.
     */
    @Bean(name = WELCOME_EMAIL_EXECUTOR)
    public ThreadPoolTaskExecutor welcomeEmailExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(1);
        executor.setMaxPoolSize(1);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("welcome-mail-");
        // Runs the overflow on the caller instead of dropping it. Reaching this
        // needs 50 queued runs, at which point making the admin wait is the
        // right answer.
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        // Let an in-flight intake finish rather than cutting mail off mid-run.
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        executor.initialize();
        return executor;
    }
}
