package com.batal.dto;

/**
 * The state of the parent welcome email switch, plus how many parents are
 * currently held back by it. The count is what makes a paused switch
 * actionable rather than just off.
 */
public class ParentWelcomeEmailSettingResponse {

    private boolean enabled;
    private long awaitingWelcomeEmailCount;

    public ParentWelcomeEmailSettingResponse() {}

    public ParentWelcomeEmailSettingResponse(boolean enabled, long awaitingWelcomeEmailCount) {
        this.enabled = enabled;
        this.awaitingWelcomeEmailCount = awaitingWelcomeEmailCount;
    }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public long getAwaitingWelcomeEmailCount() { return awaitingWelcomeEmailCount; }
    public void setAwaitingWelcomeEmailCount(long awaitingWelcomeEmailCount) {
        this.awaitingWelcomeEmailCount = awaitingWelcomeEmailCount;
    }
}
