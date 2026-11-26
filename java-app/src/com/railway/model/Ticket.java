package com.railway.model;

import java.time.LocalDateTime;

/**
 * Represents a single passenger's ticket within a Booking.
 * Status and seat fields are volatile and mutated exclusively under the TrainClass lock.
 */
public class Ticket {
    private final String ticketId;
    private final String pnr;
    private final String trainId;
    private final ClassType classType;
    private final Passenger passenger;
    private final double fare;

    private volatile TicketStatus status;
    private volatile Seat seat;
    private volatile int queuePosition; // 1-based for RAC/WAITING, 0 otherwise
    private volatile double refundAmount;
    private volatile LocalDateTime cancelledAt;

    public Ticket(String ticketId, String pnr, String trainId, ClassType classType,
                  Passenger passenger, double fare, TicketStatus initialStatus) {
        this.ticketId = ticketId;
        this.pnr = pnr;
        this.trainId = trainId;
        this.classType = classType;
        this.passenger = passenger;
        this.fare = fare;
        this.status = initialStatus;
    }

    public String getTicketId() {
        return ticketId;
    }

    public String getPnr() {
        return pnr;
    }

    public String getTrainId() {
        return trainId;
    }

    public ClassType getClassType() {
        return classType;
    }

    public Passenger getPassenger() {
        return passenger;
    }

    public double getFare() {
        return fare;
    }

    public TicketStatus getStatus() {
        return status;
    }

    public void setStatus(TicketStatus status) {
        this.status = status;
    }

    public Seat getSeat() {
        return seat;
    }

    public void setSeat(Seat seat) {
        this.seat = seat;
    }

    public int getQueuePosition() {
        return queuePosition;
    }

    public void setQueuePosition(int queuePosition) {
        this.queuePosition = queuePosition;
    }

    public double getRefundAmount() {
        return refundAmount;
    }

    public void setRefundAmount(double refundAmount) {
        this.refundAmount = refundAmount;
    }

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(LocalDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public String getAllocationDetails() {
        return switch (status) {
            case CONFIRMED -> seat != null ? "CONFIRMED | Seat " + seat.getSeatLabel() : "CONFIRMED";
            case RAC -> "RAC-" + queuePosition;
            case WAITING -> "WL-" + queuePosition;
            case CANCELLED -> String.format("CANCELLED (Refund: Rs. %.2f)", refundAmount);
        };
    }

    @Override
    public String toString() {
        return String.format("[%s] %s | Fare: Rs. %.2f | %s",
                ticketId, passenger, fare, getAllocationDetails());
    }
}
