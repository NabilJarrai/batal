package com.batal.dto;

import java.util.List;

/**
 * What happened to a bulk welcome email request.
 *
 * Delivery runs in the background, so {@code queuedCount} is a count of
 * accepted work, not of delivered mail. Skips are decided up front and are
 * final. Progress shows up in the parents list, where anyone still marked as
 * awaiting an invitation can simply be selected again.
 */
public class BulkWelcomeEmailResponse {

    private int queuedCount;
    private List<SkippedRecipient> skipped;

    public BulkWelcomeEmailResponse() {}

    public BulkWelcomeEmailResponse(int queuedCount, List<SkippedRecipient> skipped) {
        this.queuedCount = queuedCount;
        this.skipped = skipped;
    }

    public static class SkippedRecipient {
        private Long userId;
        private String name;
        private String reason;

        public SkippedRecipient() {}

        public SkippedRecipient(Long userId, String name, String reason) {
            this.userId = userId;
            this.name = name;
            this.reason = reason;
        }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public int getQueuedCount() { return queuedCount; }
    public void setQueuedCount(int queuedCount) { this.queuedCount = queuedCount; }

    public List<SkippedRecipient> getSkipped() { return skipped; }
    public void setSkipped(List<SkippedRecipient> skipped) { this.skipped = skipped; }
}
