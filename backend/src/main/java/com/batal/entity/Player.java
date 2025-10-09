package com.batal.entity;

import com.batal.entity.enums.Gender;
import com.batal.entity.enums.Level;
import com.batal.entity.enums.BasicFoot;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.HashSet;

@Entity
@Table(name = "players")
@Getter
@Setter
@NoArgsConstructor
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ========== PERSONAL DATA ==========
    @NotBlank
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @NotBlank
    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Email
    @Column(unique = true, nullable = false)
    private String email;

    private String phone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    private String address;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Enumerated(EnumType.STRING)
    private Level level;

    @Enumerated(EnumType.STRING)
    @Column(name = "basic_foot")
    private BasicFoot basicFoot;

    @Column(name = "emergency_contact_name")
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone")
    private String emergencyContactPhone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "inactive_reason", columnDefinition = "TEXT")
    private String inactiveReason;

    // ========== PARENT RELATIONSHIP (MANY-TO-MANY) ==========
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "player_parents",
        joinColumns = @JoinColumn(name = "player_id"),
        inverseJoinColumns = @JoinColumn(name = "parent_id")
    )
    private Set<User> parents = new HashSet<>();

    // Deprecated: Old single parent relationship (kept for backwards compatibility)
    @Deprecated
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", insertable = false, updatable = false)
    private User parent;

    // ========== PLAYER-SPECIFIC FIELDS ==========
    @Size(max = 10)
    @Column(name = "player_number", unique = true, length = 10)
    private String playerNumber;

    @Size(max = 50)
    @Column(length = 50)
    private String position;

    @Column(name = "assessment_notes", columnDefinition = "TEXT")
    private String assessmentNotes;

    @Column(name = "medical_notes", columnDefinition = "TEXT")
    private String medicalNotes;

    @Size(max = 10)
    @Column(name = "jersey_size", length = 10)
    private String jerseySize;

    @Column(name = "equipment_notes", columnDefinition = "TEXT")
    private String equipmentNotes;

    @Size(max = 50)
    @Column(name = "preferred_training_time", length = 50)
    private String preferredTrainingTime;

    @Column(name = "transportation_notes", columnDefinition = "TEXT")
    private String transportationNotes;

    @Column(name = "additional_skills", columnDefinition = "TEXT")
    private String additionalSkills;

    @Column(name = "development_goals", columnDefinition = "TEXT")
    private String developmentGoals;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ========== RELATIONSHIPS ==========
    @OneToMany(mappedBy = "player", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Assessment> assessments = new HashSet<>();

    @OneToMany(mappedBy = "player", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Membership> memberships = new HashSet<>();

    // ========== LIFECYCLE CALLBACKS ==========
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // ========== UTILITY METHODS ==========
    public String getFullName() {
        return firstName + " " + lastName;
    }

    public String getParentFullName() {
        return parent != null ? parent.getFullName() : null;
    }

    // ========== PARENT MANAGEMENT METHODS ==========
    /**
     * Add a parent to this player
     */
    public void addParent(User parent) {
        if (parent != null && parent.getUserType() == com.batal.entity.enums.UserType.PARENT) {
            this.parents.add(parent);
        }
    }

    /**
     * Remove a parent from this player
     */
    public void removeParent(User parent) {
        this.parents.remove(parent);
    }

    /**
     * Check if this player has any parents
     */
    public boolean hasParents() {
        return parents != null && !parents.isEmpty();
    }

    /**
     * Check if a specific user is a parent of this player
     */
    public boolean hasParent(User parent) {
        return parents != null && parents.contains(parent);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Player)) return false;
        Player player = (Player) o;
        return id != null && id.equals(player.id);
    }

    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }

    @Override
    public String toString() {
        return "Player{" +
                "id=" + id +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", email='" + email + '\'' +
                ", playerNumber='" + playerNumber + '\'' +
                ", position='" + position + '\'' +
                '}';
    }
}
