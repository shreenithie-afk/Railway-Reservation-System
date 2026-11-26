package com.railway.service;

import com.railway.model.BerthType;
import com.railway.model.Gender;
import com.railway.model.Passenger;
import com.railway.model.Seat;
import com.railway.model.TrainClass;

/**
 * Allocates seats honoring berth preference when possible, and prioritizes LOWER berths
 * for senior citizens (age 60+) and women traveling alone.
 */
public class PriorityBerthAllocationStrategy implements SeatAllocationStrategy {

    @Override
    public Seat selectSeat(TrainClass trainClass, Passenger passenger, boolean travelingAlone) {
        boolean isPriorityLower = passenger.isSenior()
                || (passenger.getGender() == Gender.FEMALE && travelingAlone);

        BerthType preference = passenger.getBerthPreference();

        if (isPriorityLower) {
            if (preference == null || preference == BerthType.LOWER) {
                Seat lower = findFirstFreeByBerth(trainClass, BerthType.LOWER);
                if (lower != null) {
                    return lower;
                }
            } else {
                Seat preferred = findFirstFreeByBerth(trainClass, preference);
                if (preferred != null) {
                    return preferred;
                }
                Seat lower = findFirstFreeByBerth(trainClass, BerthType.LOWER);
                if (lower != null) {
                    return lower;
                }
            }
        } else if (preference != null) {
            Seat preferred = findFirstFreeByBerth(trainClass, preference);
            if (preferred != null) {
                return preferred;
            }
        } else {
            // Non-priority passenger with no preference: conserve LOWER berths
            for (Seat seat : trainClass.getSeats()) {
                if (!seat.isBooked() && seat.getBerthType() != BerthType.LOWER) {
                    return seat;
                }
            }
        }

        for (Seat seat : trainClass.getSeats()) {
            if (!seat.isBooked()) {
                return seat;
            }
        }
        return null;
    }

    private Seat findFirstFreeByBerth(TrainClass trainClass, BerthType berthType) {
        for (Seat seat : trainClass.getSeats()) {
            if (!seat.isBooked() && seat.getBerthType() == berthType) {
                return seat;
            }
        }
        return null;
    }
}
