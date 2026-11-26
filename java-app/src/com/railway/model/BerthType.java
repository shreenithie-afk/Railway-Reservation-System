package com.railway.model;

import com.railway.exception.InvalidInputException;

/**
 * Available berth types inside a coach.
 */
public enum BerthType {
    LOWER("Lower"),
    MIDDLE("Middle"),
    UPPER("Upper"),
    SIDE("Side");

    private final String label;

    BerthType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    /**
     * Parses user input into a BerthType, returning null if user chooses no preference.
     */
    public static BerthType fromInput(String input) throws InvalidInputException {
        if (input == null || input.isBlank() || input.trim().equalsIgnoreCase("NONE")) {
            return null;
        }
        String normalized = input.trim().toUpperCase();
        return switch (normalized) {
            case "L", "LOWER", "1" -> LOWER;
            case "M", "MIDDLE", "2" -> MIDDLE;
            case "U", "UPPER", "3" -> UPPER;
            case "S", "SIDE", "4" -> SIDE;
            case "N", "NO", "5" -> null;
            default -> throw new InvalidInputException(
                    "Invalid berth preference '" + input + "'. Use LOWER, MIDDLE, UPPER, SIDE, or NONE.");
        };
    }
}
