package com.batal.dto;

import jakarta.validation.constraints.NotNull;

public class ParentWelcomeEmailSettingRequest {

    @NotNull(message = "enabled is required")
    private Boolean enabled;

    public Boolean getEnabled() { return enabled; }
    public void setEnabled(Boolean enabled) { this.enabled = enabled; }
}
