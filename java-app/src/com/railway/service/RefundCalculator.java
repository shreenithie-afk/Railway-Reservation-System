package com.railway.service;

import com.railway.model.Ticket;
import com.railway.model.Train;

import java.time.LocalDateTime;

/**
 * Context class delegating refund calculations to the active RefundPolicy strategy.
 */
public class RefundCalculator {
    private final RefundPolicy policy;

    public RefundCalculator(RefundPolicy policy) {
        this.policy = policy;
    }

    public double computeRefund(Ticket ticket, Train train, LocalDateTime cancellationTime) {
        return policy.calculateRefund(ticket, train, cancellationTime);
    }
}
