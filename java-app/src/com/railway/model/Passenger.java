package com.railway.model;

/**
 * Immutable passenger details captured during booking.
 */
public class Passenger {
    private final String name;
    private final int age;
    private final Gender gender;
    private final BerthType berthPreference; // nullable when no preference

    public Passenger(String name, int age, Gender gender, BerthType berthPreference) {
        this.name = name;
        this.age = age;
        this.gender = gender;
        this.berthPreference = berthPreference;
    }

    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }

    public Gender getGender() {
        return gender;
    }

    public BerthType getBerthPreference() {
        return berthPreference;
    }

    public boolean isSenior() {
        return age >= 60;
    }

    @Override
    public String toString() {
        String pref = berthPreference != null ? berthPreference.getLabel() : "None";
        return String.format("%s (%d/%s, Pref: %s)", name, age, gender.name().charAt(0), pref);
    }
}
