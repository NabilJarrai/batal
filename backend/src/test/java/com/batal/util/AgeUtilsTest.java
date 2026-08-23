package com.batal.util;

import com.batal.entity.enums.AgeGroup;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class AgeUtilsTest {

    @Test
    void countsOnlyCompletedYears() {
        LocalDate today = LocalDate.now();

        assertEquals(6, AgeUtils.calculateAge(today.minusYears(6)),
                "a birthday falling today has been completed");
        assertEquals(6, AgeUtils.calculateAge(today.minusYears(7).plusDays(1)),
                "one day short of the 7th birthday is still 6");
        assertEquals(7, AgeUtils.calculateAge(today.minusYears(7)));
    }

    @Test
    void sixYearOldBelongsInCookiesUntilTheSeventhBirthday() {
        // The reported bug: a 6 year old whose birthday had not come round yet
        // was counted as 7 and placed in Dolphins.
        LocalDate dayBeforeSeventhBirthday = LocalDate.now().minusYears(7).plusDays(1);

        assertEquals(AgeGroup.COOKIES,
                AgeGroup.getByAge(AgeUtils.calculateAge(dayBeforeSeventhBirthday)));
    }

    @Test
    void movesUpOnTheBirthdayItself() {
        assertEquals(AgeGroup.DOLPHINS,
                AgeGroup.getByAge(AgeUtils.calculateAge(LocalDate.now().minusYears(7))));
    }

    @Test
    void rejectsMissingDateOfBirth() {
        assertThrows(IllegalArgumentException.class, () -> AgeUtils.calculateAge(null));
    }
}
