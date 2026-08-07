package com.batal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Relieve a full group by splitting it.
 *
 * Creates a sibling group carrying the same level, age group and assessment,
 * moves the chosen players into it, and optionally places the player who
 * triggered the overflow in whichever group the admin picked.
 */
public class GroupSplitRequest {

    @NotBlank(message = "New group name is required")
    @Size(max = 100, message = "Group name must not exceed 100 characters")
    private String newGroupName;

    /**
     * Players to move out of the original group. May be empty when the admin
     * only wants somewhere to put the new player.
     */
    private List<Long> playerIdsToMove;

    /** The player whose assignment hit the limit. Optional. */
    private Long newPlayerId;

    /**
     * Where newPlayerId goes. True places them in the group just created,
     * false leaves them in the original.
     */
    private Boolean newPlayerJoinsNewGroup = true;

    public String getNewGroupName() { return newGroupName; }
    public void setNewGroupName(String newGroupName) { this.newGroupName = newGroupName; }

    public List<Long> getPlayerIdsToMove() { return playerIdsToMove; }
    public void setPlayerIdsToMove(List<Long> playerIdsToMove) { this.playerIdsToMove = playerIdsToMove; }

    public Long getNewPlayerId() { return newPlayerId; }
    public void setNewPlayerId(Long newPlayerId) { this.newPlayerId = newPlayerId; }

    public Boolean getNewPlayerJoinsNewGroup() { return newPlayerJoinsNewGroup; }
    public void setNewPlayerJoinsNewGroup(Boolean newPlayerJoinsNewGroup) {
        this.newPlayerJoinsNewGroup = newPlayerJoinsNewGroup;
    }
}
