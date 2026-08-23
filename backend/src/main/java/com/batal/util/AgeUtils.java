package com.batal.util;

import java.time.LocalDate;
import java.time.Period;

/**
 * Age calculation shared by everything that maps a player onto an age group.
 *
 * Subtracting birth years alone counts a birthday that has not happened yet,
 * so a child stayed one year "too old" from January until their birthday and
 * was placed in the next age group up — a 6 year old landing in Dolphins (7-10)
 * instead of Cookies (4-6). The frontend has always counted completed years,
 * so the two disagreed on screen.
 */
public final class AgeUtils {

    private AgeUtils() {
    }

    /**
     * Completed years lived, matching how the frontend displays a player's age.
     */
    public static int calculateAge(LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            throw new IllegalArgumentException("dateOfBirth is required to calculate age");
        }
        return Period.between(dateOfBirth, LocalDate.now()).getYears();
    }
}
