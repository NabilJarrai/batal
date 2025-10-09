package com.batal.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for assigning a child (player) to a parent
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignChildRequest {

    @NotNull(message = "Player ID is required")
    private Long playerId;
}
