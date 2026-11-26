package com.railway.util;

import com.railway.exception.InvalidInputException;
import com.railway.model.Passenger;

import java.util.List;

/**
 * Central input validation utility.
 */
public final class ValidationUtil {
    public static final int MAX_PASSENGERS_PER_BOOKING = 6;
    public static final int MIN_AGE = 1;
    public static final int MAX_AGE = 120;

    private ValidationUtil() {
    }

    public static void validateNonBlank(String value, String fieldName) throws InvalidInputException {
        if (value == null || value.isBlank()) {
            throw new InvalidInputException(fieldName + " cannot be blank.");
        }
    }

    public static void validatePassengers(List<Passenger> passengers) throws InvalidInputException {
        if (passengers == null || passengers.isEmpty()) {
            throw new InvalidInputException("At least 1 passenger is required for booking.");
        }
        if (passengers.size() > MAX_PASSENGERS_PER_BOOKING) {
            throw new InvalidInputException(
                    "Maximum " + MAX_PASSENGERS_PER_BOOKING + " passengers allowed per booking.");
        }
        for (int i = 0; i < passengers.size(); i++) {
            Passenger p = passengers.get(i);
            if (p == null) {
                throw new InvalidInputException("Passenger #" + (i + 1) + " cannot be null.");
            }
            validateNonBlank(p.getName(), "Passenger #" + (i + 1) + " name");
            if (p.getAge() < MIN_AGE || p.getAge() > MAX_AGE) {
                throw new InvalidInputException(
                        "Invalid age " + p.getAge() + " for " + p.getName()
                                + ". Age must be between " + MIN_AGE + " and " + MAX_AGE + ".");
            }
            if (p.getGender() == null) {
                throw new InvalidInputException("Gender is required for " + p.getName() + ".");
            }
        }
    }
}
