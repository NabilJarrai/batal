package com.batal.dto;

/**
 * Both sides of a split, so the caller can refresh them together.
 */
public class GroupSplitResponse {

    private GroupResponse originalGroup;
    private GroupResponse newGroup;
    private Integer playersMoved;

    public GroupSplitResponse() {}

    public GroupSplitResponse(GroupResponse originalGroup, GroupResponse newGroup, Integer playersMoved) {
        this.originalGroup = originalGroup;
        this.newGroup = newGroup;
        this.playersMoved = playersMoved;
    }

    public GroupResponse getOriginalGroup() { return originalGroup; }
    public void setOriginalGroup(GroupResponse originalGroup) { this.originalGroup = originalGroup; }

    public GroupResponse getNewGroup() { return newGroup; }
    public void setNewGroup(GroupResponse newGroup) { this.newGroup = newGroup; }

    public Integer getPlayersMoved() { return playersMoved; }
    public void setPlayersMoved(Integer playersMoved) { this.playersMoved = playersMoved; }
}
