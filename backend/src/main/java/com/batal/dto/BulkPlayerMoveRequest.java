package com.batal.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Move several players out of a group in one go.
 *
 * A null targetGroupId means "remove them from this group", leaving them
 * unassigned. Anything else moves them into that group.
 */
public class BulkPlayerMoveRequest {

    @NotEmpty(message = "Select at least one player")
    @Size(max = 100, message = "At most 100 players can be moved at once")
    private List<Long> playerIds;

    /** Destination group, or null to leave the players unassigned. */
    private Long targetGroupId;

    public List<Long> getPlayerIds() { return playerIds; }
    public void setPlayerIds(List<Long> playerIds) { this.playerIds = playerIds; }

    public Long getTargetGroupId() { return targetGroupId; }
    public void setTargetGroupId(Long targetGroupId) { this.targetGroupId = targetGroupId; }
}
