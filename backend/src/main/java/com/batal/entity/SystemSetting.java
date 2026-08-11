package com.batal.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * One academy-wide switch, stored as text and parsed by
 * {@link com.batal.service.SystemSettingService}.
 *
 * The key is the primary key, so a setting cannot be written twice and reading
 * one never depends on ordering.
 */
@Entity
@Table(name = "system_settings")
@Getter
@Setter
@NoArgsConstructor
public class SystemSetting {

    @Id
    @Column(name = "setting_key", length = 100)
    private String key;

    @Column(name = "setting_value", nullable = false, length = 500)
    private String value;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    /** Admin who last changed this. Null for a seeded default. */
    @Column(name = "updated_by")
    private Long updatedBy;

    public SystemSetting(String key, String value) {
        this.key = key;
        this.value = value;
    }
}
