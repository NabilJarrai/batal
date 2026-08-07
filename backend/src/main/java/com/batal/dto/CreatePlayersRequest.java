package com.batal.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

/**
 * Create one or more players under a single main parent.
 *
 * The whole request succeeds or fails together, so a failure part way through
 * cannot leave a parent account behind with no children. Supply either
 * parentId, to hang the players off a parent who already exists, or newParent
 * to create one.
 */
public class CreatePlayersRequest {

    /** Existing parent to attach the players to. Mutually exclusive with newParent. */
    private Long parentId;

    /** Details for a parent who does not exist yet. Mutually exclusive with parentId. */
    @Valid
    private NewParent newParent;

    @NotEmpty(message = "At least one player is required")
    @Size(max = 10, message = "At most 10 players can be created at once")
    @Valid
    private List<PlayerDTO> players;

    /** Assign each player to a group based on age and level. */
    private boolean autoAssignGroup = true;

    @AssertTrue(message = "Provide either an existing parentId or the details of a new parent, not both")
    public boolean isParentChoiceValid() {
        return (parentId == null) != (newParent == null);
    }

    /**
     * Details for a main parent. Unlike the secondary parent, this one gets a
     * real account, so email is required and must be unique. Phone is required
     * by the academy for the main contact.
     */
    public static class NewParent {

        @NotBlank(message = "Parent first name is required")
        @Size(max = 100, message = "Parent first name must not exceed 100 characters")
        private String firstName;

        @NotBlank(message = "Parent last name is required")
        @Size(max = 100, message = "Parent last name must not exceed 100 characters")
        private String lastName;

        @NotBlank(message = "Parent email is required")
        @Email(message = "Parent email must be a valid email address")
        @Size(max = 255, message = "Parent email must not exceed 255 characters")
        private String email;

        @NotBlank(message = "Parent mobile number is required")
        @Size(max = 20, message = "Parent mobile number must not exceed 20 characters")
        private String phone;

        @Size(max = 500, message = "Address must not exceed 500 characters")
        private String address;

        // The family's second guardian. Contact only, so both are optional.
        @Size(max = 200, message = "Secondary parent name must not exceed 200 characters")
        private String secondaryParentName;

        @Email(message = "Secondary parent email must be a valid email address")
        @Size(max = 255, message = "Secondary parent email must not exceed 255 characters")
        private String secondaryParentEmail;

        @Size(max = 20, message = "Secondary parent phone must not exceed 20 characters")
        private String secondaryParentPhone;

        public String getSecondaryParentName() { return secondaryParentName; }
        public void setSecondaryParentName(String secondaryParentName) { this.secondaryParentName = secondaryParentName; }

        public String getSecondaryParentEmail() { return secondaryParentEmail; }
        public void setSecondaryParentEmail(String secondaryParentEmail) { this.secondaryParentEmail = secondaryParentEmail; }

        public String getSecondaryParentPhone() { return secondaryParentPhone; }
        public void setSecondaryParentPhone(String secondaryParentPhone) { this.secondaryParentPhone = secondaryParentPhone; }

        public String getFirstName() { return firstName; }
        public void setFirstName(String firstName) { this.firstName = firstName; }

        public String getLastName() { return lastName; }
        public void setLastName(String lastName) { this.lastName = lastName; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }

        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
    }

    public Long getParentId() { return parentId; }
    public void setParentId(Long parentId) { this.parentId = parentId; }

    public NewParent getNewParent() { return newParent; }
    public void setNewParent(NewParent newParent) { this.newParent = newParent; }

    public List<PlayerDTO> getPlayers() { return players; }
    public void setPlayers(List<PlayerDTO> players) { this.players = players; }

    public boolean isAutoAssignGroup() { return autoAssignGroup; }
    public void setAutoAssignGroup(boolean autoAssignGroup) { this.autoAssignGroup = autoAssignGroup; }
}
