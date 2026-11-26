package com.railway.model;

import com.railway.service.WaitingListManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Represents a travel class (SL, 3A, 2A, 1A) on a specific train.
 * Holds a dedicated ReentrantLock for fine-grained per-train-and-class concurrency control.
 */
public class TrainClass {
    private final ClassType classType;
    private final int seatCapacity;
    private final double fare;
    private final int racLimit;
    private final int wlLimit;
    private final List<Seat> seats;
    private final WaitingListManager waitingListManager;
    private final ReentrantLock lock;

    public TrainClass(ClassType classType, int seatCapacity, double fare, int racLimit, int wlLimit) {
        if (seatCapacity < 0 || fare <= 0 || racLimit < 0 || wlLimit < 0) {
            throw new IllegalArgumentException("Invalid TrainClass configuration parameters.");
        }
        this.classType = classType;
        this.seatCapacity = seatCapacity;
        this.fare = fare;
        this.racLimit = racLimit;
        this.wlLimit = wlLimit;
        this.seats = initializeSeats(classType, seatCapacity);
        this.waitingListManager = new WaitingListManager(racLimit, wlLimit);
        this.lock = new ReentrantLock();
    }

    private List<Seat> initializeSeats(ClassType type, int capacity) {
        List<Seat> list = new ArrayList<>(capacity);
        BerthType[] pattern = switch (type) {
            case SL, THREE_A -> new BerthType[]{
                    BerthType.LOWER, BerthType.MIDDLE, BerthType.UPPER,
                    BerthType.LOWER, BerthType.MIDDLE, BerthType.UPPER,
                    BerthType.SIDE, BerthType.SIDE
            };
            case TWO_A -> new BerthType[]{
                    BerthType.LOWER, BerthType.UPPER,
                    BerthType.LOWER, BerthType.UPPER,
                    BerthType.SIDE, BerthType.SIDE
            };
            case ONE_A -> new BerthType[]{
                    BerthType.LOWER, BerthType.UPPER
            };
        };

        int seatsPerCoach = switch (type) {
            case SL, THREE_A -> 72;
            case TWO_A -> 48;
            case ONE_A -> 24;
        };

        for (int i = 0; i < capacity; i++) {
            int seatNo = i + 1;
            String coach = type.getCoachPrefix() + ((i / seatsPerCoach) + 1);
            BerthType berth = pattern[i % pattern.length];
            list.add(new Seat(seatNo, coach, berth));
        }
        return Collections.unmodifiableList(list);
    }

    public ClassType getClassType() {
        return classType;
    }

    public int getSeatCapacity() {
        return seatCapacity;
    }

    public double getFare() {
        return fare;
    }

    public int getRacLimit() {
        return racLimit;
    }

    public int getWlLimit() {
        return wlLimit;
    }

    public List<Seat> getSeats() {
        return seats;
    }

    public WaitingListManager getWaitingListManager() {
        return waitingListManager;
    }

    public ReentrantLock getLock() {
        return lock;
    }

    /**
     * Must be called with {@link #lock} held.
     */
    public int getAvailableConfirmedCount() {
        int available = 0;
        for (Seat seat : seats) {
            if (!seat.isBooked()) {
                available++;
            }
        }
        return available;
    }

    /**
     * Must be called with {@link #lock} held.
     */
    public int getTotalRemainingCapacity() {
        return getAvailableConfirmedCount()
                + waitingListManager.getAvailableRacSlots()
                + waitingListManager.getAvailableWaitingSlots();
    }
}
