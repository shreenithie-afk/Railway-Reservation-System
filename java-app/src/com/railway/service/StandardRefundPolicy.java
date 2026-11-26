package com.railway.service;

import com.railway.model.Ticket;
import com.railway.model.TicketStatus;
import com.railway.model.Train;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Standard refund tiers:
 * - WAITING tickets (before departure): full fare minus flat clearing fee.
 * - CONFIRMED / RAC tickets:
 *   > 48 hours before departure : 75%
 *   12 - 48 hours before departure : 50%
 *   < 12 hours before departure (> 0) : 25%
 *   At or after departure : 0%
 */
public class StandardRefundPolicy implements RefundPolicy {
    private static final double WAITING_CLEARING_FEE = 60.0;

    @Override
    public double calculateRefund(Ticket ticket, Train train, LocalDateTime cancellationTime) {
        long minutesBeforeDeparture = Duration.between(cancellationTime, train.getDepartureTime()).toMinutes();
        if (minutesBeforeDeparture <= 0) {
            return 0.0;
        }

        double fare = ticket.getFare();
        if (ticket.getStatus() == TicketStatus.WAITING) {
            return roundCurrency(Math.max(0.0, fare - WAITING_CLEARING_FEE));
        }

        double hours = minutesBeforeDeparture / 60.0;
        double rate;
        if (hours > 48.0) {
            rate = 0.75;
        } else if (hours >= 12.0) {
            rate = 0.50;
        } else {
            rate = 0.25;
        }
        return roundCurrency(fare * rate);
    }

    private double roundCurrency(double amount) {
        return Math.round(amount * 100.0) / 100.0;
    }
}
