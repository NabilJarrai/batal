package com.batal.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Send the welcome (password setup) email to a chosen set of parents.
 *
 * The cap is a guard against a runaway selection turning into an unbounded
 * mail run, not a limit the admin is meant to feel - it is well above the size
 * of a single intake.
 */
public class BulkWelcomeEmailRequest {

    @NotEmpty(message = "Select at least one parent")
    @Size(max = 500, message = "At most 500 welcome emails can be sent at once")
    private List<Long> userIds;

    public List<Long> getUserIds() { return userIds; }
    public void setUserIds(List<Long> userIds) { this.userIds = userIds; }
}
