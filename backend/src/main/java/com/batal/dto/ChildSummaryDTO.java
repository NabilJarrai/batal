package com.batal.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * DTO for child summary information returned to parents on login
 */
@Getter
@Setter
@NoArgsConstructor
public class ChildSummaryDTO {

    private Long id;
    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private String groupName;
    private String level;
    private Boolean isActive;

    public ChildSummaryDTO(Long id, String firstName, String lastName, LocalDate dateOfBirth,
                           String groupName, String level, Boolean isActive) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.dateOfBirth = dateOfBirth;
        this.groupName = groupName;
        this.level = level;
        this.isActive = isActive;
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }
}
