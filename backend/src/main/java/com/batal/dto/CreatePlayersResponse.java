package com.batal.dto;

import java.util.List;

/**
 * Result of creating players under a main parent.
 */
public class CreatePlayersResponse {

    private List<PlayerDTO> players;
    private UserResponse parent;

    /** True when this request created the parent account rather than reusing one. */
    private boolean parentCreated;

    public CreatePlayersResponse() {}

    public CreatePlayersResponse(List<PlayerDTO> players, UserResponse parent, boolean parentCreated) {
        this.players = players;
        this.parent = parent;
        this.parentCreated = parentCreated;
    }

    public List<PlayerDTO> getPlayers() { return players; }
    public void setPlayers(List<PlayerDTO> players) { this.players = players; }

    public UserResponse getParent() { return parent; }
    public void setParent(UserResponse parent) { this.parent = parent; }

    public boolean isParentCreated() { return parentCreated; }
    public void setParentCreated(boolean parentCreated) { this.parentCreated = parentCreated; }
}
