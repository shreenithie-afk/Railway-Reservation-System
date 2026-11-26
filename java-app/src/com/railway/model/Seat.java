package com.railway.model;

/**
 * Represents a physical seat/berth in a train class.
 * All mutations must occur while holding the owning TrainClass lock.
 */
public class Seat {
    private final int seatNumber;
    private final String coach;
    private final BerthType berthType;
    private boolean booked;
    private String assignedTicketId;

    public Seat(int seatNumber, String coach, BerthType berthType) {
        this.seatNumber = seatNumber;
        this.coach = coach;
        this.berthType = berthType;
        this.booked = false;
        this.assignedTicketId = null;
    }

    public int getSeatNumber() {
        return seatNumber;
    }

    public String getCoach() {
        return coach;
    }

    public BerthType getBerthType() {
        return berthType;
    }

    public boolean isBooked() {
        return booked;
    }

    public String getAssignedTicketId() {
        return assignedTicketId;
    }

    public void allocate(String ticketId) {
        if (this.booked) {
            throw new IllegalStateException("Seat " + getSeatLabel() + " is already booked by " + this.assignedTicketId);
        }
        this.booked = true;
        this.assignedTicketId = ticketId;
    }

    public void release() {
        this.booked = false;
        this.assignedTicketId = null;
    }

    public String getSeatLabel() {
        return coach + "-" + seatNumber + " (" + berthType.getLabel() + ")";
    }

    @Override
    public String toString() {
        return getSeatLabel();
    }
}
