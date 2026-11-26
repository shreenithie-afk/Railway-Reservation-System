package com.railway.model;

import com.railway.exception.InvalidInputException;

/**
 * Supported railway coach classes.
 */
public enum ClassType {
    SL("Sleeper", "SL", "S"),
    THREE_A("AC 3 Tier", "3A", "B"),
    TWO_A("AC 2 Tier", "2A", "A"),
    ONE_A("First AC", "1A", "H");

    private final String displayName;
    private final String code;
    private final String coachPrefix;

    ClassType(String displayName, String code, String coachPrefix) {
        this.displayName = displayName;
        this.code = code;
        this.coachPrefix = coachPrefix;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getCode() {
        return code;
    }

    public String getCoachPrefix() {
        return coachPrefix;
    }

    public static ClassType fromCode(String input) throws InvalidInputException {
        if (input == null || input.isBlank()) {
            throw new InvalidInputException("Class type cannot be empty. Valid options: SL, 3A, 2A, 1A.");
        }
        String normalized = input.trim().toUpperCase();
        for (ClassType type : values()) {
            if (type.code.equals(normalized) || type.name().equals(normalized)) {
                return type;
            }
        }
        throw new InvalidInputException("Invalid class '" + input + "'. Valid options: SL, 3A, 2A, 1A.");
    }
}
