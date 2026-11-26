package com.railway.model;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/**
 * Groups 1 to 6 passenger tickets under a single PNR.
 */
public class Booking {
    private final String pnr;
    private final String userId;
    private final String trainId;
    private final ClassType classType;
    private final LocalDateTime bookedAt;
    private final List<Ticket> tickets;
    private final double totalFare;

    public Booking(String pnr, String userId, String trainId, ClassType classType,
                   LocalDateTime bookedAt, List<Ticket> tickets, double totalFare) {
        this.pnr = pnr;
        this.userId = userId;
        this.trainId = trainId;
        this.classType = classType;
        this.bookedAt = bookedAt;
        this.tickets = Collections.unmodifiableList(List.copyOf(tickets));
        this.totalFare = totalFare;
    }

    public String getPnr() {
        return pnr;
    }

    public String getUserId() {
        return userId;
    }

    public String getTrainId() {
        return trainId;
    }

    public ClassType getClassType() {
        return classType;
    }

    public LocalDateTime getBookedAt() {
        return bookedAt;
    }

    public List<Ticket> getTickets() {
        return tickets;
    }

    public double getTotalFare() {
        return totalFare;
    }

    public String getOverallStatusSummary() {
        long confirmed = tickets.stream().filter(t -> t.getStatus() == TicketStatus.CONFIRMED).count();
        long rac = tickets.stream().filter(t -> t.getStatus() == TicketStatus.RAC).count();
        long wl = tickets.stream().filter(t -> t.getStatus() == TicketStatus.WAITING).count();
        long cancelled = tickets.stream().filter(t -> t.getStatus() == TicketStatus.CANCELLED).count();

        if (cancelled == tickets.size()) {
            return "ALL CANCELLED";
        }
        return String.format("CONFIRMED:%d, RAC:%d, WL:%d, CANCELLED:%d", confirmed, rac, wl, cancelled);
    }
}
