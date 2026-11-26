package com.railway.model;

import com.railway.exception.InvalidInputException;

/**
 * Passenger gender options.
 */
public enum Gender {
    MALE,
    FEMALE,
    OTHER;

    public static Gender fromInput(String input) throws InvalidInputException {
        if (input == null || input.isBlank()) {
            throw new InvalidInputException("Gender cannot be empty. Valid options: M/MALE, F/FEMALE, O/OTHER.");
        }
        String normalized = input.trim().toUpperCase();
        return switch (normalized) {
            case "M", "MALE" -> MALE;
            case "F", "FEMALE" -> FEMALE;
            case "O", "OTHER" -> OTHER;
            default -> throw new InvalidInputException(
                    "Invalid gender '" + input + "'. Valid options: M/MALE, F/FEMALE, O/OTHER.");
        };
    }
}
