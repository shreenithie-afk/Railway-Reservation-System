package com.railway.service;

import com.railway.model.Ticket;
import com.railway.model.Train;

import java.time.LocalDateTime;

/**
 * Strategy interface for computing cancellation refunds.
 */
public interface RefundPolicy {
    double calculateRefund(Ticket ticket, Train train, LocalDateTime cancellationTime);
}
