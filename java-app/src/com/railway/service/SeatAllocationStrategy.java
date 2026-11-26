package com.railway.service;

import com.railway.model.Passenger;
import com.railway.model.Seat;
import com.railway.model.TrainClass;

/**
 * Strategy interface for seat/berth allocation policies.
 */
public interface SeatAllocationStrategy {
    /**
     * Selects an unbooked seat from the given TrainClass for the passenger.
     * Must be invoked while holding TrainClass.getLock().
     */
    Seat selectSeat(TrainClass trainClass, Passenger passenger, boolean travelingAlone);
}
