package com.batal.dto;

import com.batal.entity.enums.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PlayerDTO {
    private Long id;
    
    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name must not exceed 100 characters")
    private String firstName;
    
    @NotBlank(message = "Last name is required") 
    @Size(max = 100, message = "Last name must not exceed 100 characters")
    private String lastName;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;
    
    @Size(max = 20, message = "Phone must not exceed 20 characters")
    private String phone;
    
    private LocalDate dateOfBirth;
    
    private Gender gender;
    
    @Size(max = 500, message = "Address must not exceed 500 characters")
    private String address;
    
    @NotBlank(message = "Parent name is required")
    @Size(max = 200, message = "Parent name must not exceed 200 characters")
    private String parentName;
    
    private LocalDate joiningDate;
    
    @NotNull(message = "Level is required")
    private Level level;
    
    private BasicFoot basicFoot;
    
    @Size(max = 255, message = "Emergency contact name must not exceed 255 characters")
    private String emergencyContactName;
    
    @Size(max = 20, message = "Emergency contact phone must not exceed 20 characters")
    private String emergencyContactPhone;
    
    private Boolean isActive;
    
    @Size(max = 500, message = "Inactive reason must not exceed 500 characters")
    private String inactiveReason;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Group information
    private Long groupId;
    private String groupName;
    
    // Constructors
    public PlayerDTO() {}
    
    public PlayerDTO(String firstName, String lastName, String email, String parentName, Level level) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.parentName = parentName;
        this.level = level;
        this.isActive = true;
        this.joiningDate = LocalDate.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    
    public Gender getGender() { return gender; }
    public void setGender(Gender gender) { this.gender = gender; }
    
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    
    public String getParentName() { return parentName; }
    public void setParentName(String parentName) { this.parentName = parentName; }
    
    public LocalDate getJoiningDate() { return joiningDate; }
    public void setJoiningDate(LocalDate joiningDate) { this.joiningDate = joiningDate; }
    
    public Level getLevel() { return level; }
    public void setLevel(Level level) { this.level = level; }
    
    public BasicFoot getBasicFoot() { return basicFoot; }
    public void setBasicFoot(BasicFoot basicFoot) { this.basicFoot = basicFoot; }
    
    public String getEmergencyContactName() { return emergencyContactName; }
    public void setEmergencyContactName(String emergencyContactName) { this.emergencyContactName = emergencyContactName; }
    
    public String getEmergencyContactPhone() { return emergencyContactPhone; }
    public void setEmergencyContactPhone(String emergencyContactPhone) { this.emergencyContactPhone = emergencyContactPhone; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public String getInactiveReason() { return inactiveReason; }
    public void setInactiveReason(String inactiveReason) { this.inactiveReason = inactiveReason; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public Long getGroupId() { return groupId; }
    public void setGroupId(Long groupId) { this.groupId = groupId; }
    
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    
    // Helper methods
    public String getFullName() {
        return firstName + " " + lastName;
    }
    
    @Override
    public String toString() {
        return "PlayerDTO{" +
                "id=" + id +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", email='" + email + '\'' +
                ", level=" + level +
                ", isActive=" + isActive +
                '}';
    }
}
