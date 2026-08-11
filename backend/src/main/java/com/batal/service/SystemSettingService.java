package com.batal.service;

import com.batal.entity.SystemSetting;
import com.batal.repository.SystemSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Reads and writes the academy-wide switches in {@code system_settings}.
 */
@Service
public class SystemSettingService {

    /**
     * When false, creating a PARENT account does not send its welcome email.
     * The account is still created and the admin sends the invitations later,
     * in bulk, from the parents list.
     *
     * Scoped to parents on purpose: staff accounts are created one at a time by
     * someone who wants that person logging in now, so they always get the mail.
     */
    public static final String PARENT_WELCOME_EMAILS_ENABLED = "parent_welcome_emails_enabled";

    @Autowired
    private SystemSettingRepository settingRepository;

    /**
     * Missing rows read as the default rather than throwing, so a settings row
     * that was never seeded cannot stop accounts from being created.
     */
    @Transactional(readOnly = true)
    public boolean getBoolean(String key, boolean defaultValue) {
        return settingRepository.findByKey(key)
                .map(setting -> Boolean.parseBoolean(setting.getValue()))
                .orElse(defaultValue);
    }

    @Transactional
    public void setBoolean(String key, boolean value, Long updatedBy) {
        SystemSetting setting = settingRepository.findByKey(key)
                .orElseGet(() -> new SystemSetting(key, String.valueOf(value)));
        setting.setValue(String.valueOf(value));
        setting.setUpdatedAt(LocalDateTime.now());
        setting.setUpdatedBy(updatedBy);
        settingRepository.save(setting);
    }

    /** Defaults to true so a missing row keeps the pre-existing behaviour. */
    @Transactional(readOnly = true)
    public boolean isParentWelcomeEmailEnabled() {
        return getBoolean(PARENT_WELCOME_EMAILS_ENABLED, true);
    }

    @Transactional
    public void setParentWelcomeEmailEnabled(boolean enabled, Long updatedBy) {
        setBoolean(PARENT_WELCOME_EMAILS_ENABLED, enabled, updatedBy);
    }
}
