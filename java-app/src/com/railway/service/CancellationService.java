package com.railway.service;

import com.railway.exception.InvalidCancellationException;
import com.railway.exception.InvalidInputException;
import com.railway.exception.InvalidPNRException;
import com.railway.exception.TrainNotFoundException;
import com.railway.model.Booking;
import com.railway.model.Seat;
import com.railway.model.Ticket;
import com.railway.model.TicketStatus;
import com.railway.model.Train;
import com.railway.model.TrainClass;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Handles full and partial ticket cancellations with atomic FIFO promotions
 * (RAC -> CONFIRMED, WAITING -> RAC) and refund computation.
 */
public class CancellationService {
    private final TrainRepository trainRepository;
    private final BookingRepository bookingRepository;
    private final SeatAllocationStrategy allocationStrategy;
    private final RefundCalculator refundCalculator;

    public record CancellationResult(
            String pnr,
            List<Ticket> cancelledTickets,
            List<String> promotionLog,
            double totalRefund
    ) {}

    public CancellationService(TrainRepository trainRepository,
                               BookingRepository bookingRepository,
                               SeatAllocationStrategy allocationStrategy,
                               RefundCalculator refundCalculator) {
        this.trainRepository = trainRepository;
        this.bookingRepository = bookingRepository;
        this.allocationStrategy = allocationStrategy;
        this.refundCalculator = refundCalculator;
    }

    public CancellationResult cancelFullPnr(String pnr)
            throws InvalidPNRException, TrainNotFoundException, InvalidInputException, InvalidCancellationException {
        return cancelFullPnr(pnr, LocalDateTime.now());
    }

    public CancellationResult cancelFullPnr(String pnr, LocalDateTime cancellationTime)
            throws InvalidPNRException, TrainNotFoundException, InvalidInputException, InvalidCancellationException {
        Booking booking = bookingRepository.findByPnr(pnr);
        List<String> activeTicketIds = new ArrayList<>();
        for (Ticket t : booking.getTickets()) {
            if (t.getStatus() != TicketStatus.CANCELLED) {
                activeTicketIds.add(t.getTicketId());
            }
        }
        if (activeTicketIds.isEmpty()) {
            throw new InvalidCancellationException("All tickets under PNR " + booking.getPnr() + " are already cancelled.");
        }
        return cancelTickets(pnr, activeTicketIds, cancellationTime);
    }

    public CancellationResult cancelTickets(String pnr, List<String> ticketIds)
            throws InvalidPNRException, TrainNotFoundException, InvalidInputException, InvalidCancellationException {
        return cancelTickets(pnr, ticketIds, LocalDateTime.now());
    }

    public CancellationResult cancelTickets(String pnr, List<String> ticketIds, LocalDateTime cancellationTime)
            throws InvalidPNRException, TrainNotFoundException, InvalidInputException, InvalidCancellationException {
        if (ticketIds == null || ticketIds.isEmpty()) {
            throw new InvalidInputException("At least one Ticket ID must be provided for cancellation.");
        }

        Booking booking = bookingRepository.findByPnr(pnr);
        Train train = trainRepository.findById(booking.getTrainId());
        TrainClass trainClass = train.getTrainClass(booking.getClassType());

        Set<String> uniqueIds = new LinkedHashSet<>();
        for (String id : ticketIds) {
            if (id != null && !id.isBlank()) {
                uniqueIds.add(id.trim().toUpperCase());
            }
        }
        if (uniqueIds.isEmpty()) {
            throw new InvalidInputException("No valid Ticket IDs provided.");
        }

        ReentrantLock lock = trainClass.getLock();
        lock.lock();
        try {
            List<Ticket> targets = new ArrayList<>();
            for (String targetId : uniqueIds) {
                Ticket matched = booking.getTickets().stream()
                        .filter(t -> t.getTicketId().equalsIgnoreCase(targetId))
                        .findFirst()
                        .orElseThrow(() -> new InvalidCancellationException(
                                "Ticket " + targetId + " does not belong to PNR " + booking.getPnr() + "."));

                if (matched.getStatus() == TicketStatus.CANCELLED) {
                    throw new InvalidCancellationException(
                            "Ticket " + matched.getTicketId() + " is already cancelled.");
                }
                targets.add(matched);
            }

            double totalRefund = 0.0;
            List<String> promotionLog = new ArrayList<>();
            WaitingListManager wlm = trainClass.getWaitingListManager();

            for (Ticket ticket : targets) {
                TicketStatus previousStatus = ticket.getStatus();
                double refund = refundCalculator.computeRefund(ticket, train, cancellationTime);

                ticket.setRefundAmount(refund);
                ticket.setCancelledAt(cancellationTime);
                totalRefund += refund;

                if (previousStatus == TicketStatus.CONFIRMED) {
                    Seat freedSeat = ticket.getSeat();
                    ticket.setSeat(null);
                    ticket.setStatus(TicketStatus.CANCELLED);
                    if (freedSeat != null) {
                        freedSeat.release();
                    }
                    promoteAfterConfirmedCancellation(trainClass, wlm, promotionLog);
                } else if (previousStatus == TicketStatus.RAC) {
                    wlm.removeRac(ticket);
                    ticket.setStatus(TicketStatus.CANCELLED);
                    promoteWaitingToRac(wlm, promotionLog);
                } else if (previousStatus == TicketStatus.WAITING) {
                    wlm.removeWaiting(ticket);
                    ticket.setStatus(TicketStatus.CANCELLED);
                }
            }

            totalRefund = Math.round(totalRefund * 100.0) / 100.0;
            return new CancellationResult(booking.getPnr(), targets, promotionLog, totalRefund);
        } finally {
            lock.unlock();
        }
    }

    private void promoteAfterConfirmedCancellation(TrainClass trainClass,
                                                   WaitingListManager wlm,
                                                   List<String> promotionLog) {
        Ticket nextRac = wlm.pollNextRac();
        if (nextRac != null) {
            Seat seat = allocationStrategy.selectSeat(trainClass, nextRac.getPassenger(), true);
            if (seat != null) {
                seat.allocate(nextRac.getTicketId());
                nextRac.setSeat(seat);
                nextRac.setStatus(TicketStatus.CONFIRMED);
                promotionLog.add(String.format("Promoted %s (%s) from RAC -> CONFIRMED (%s)",
                        nextRac.getTicketId(), nextRac.getPnr(), seat.getSeatLabel()));
                promoteWaitingToRac(wlm, promotionLog);
            }
        } else if (trainClass.getRacLimit() == 0) {
            Ticket nextWl = wlm.pollNextWaiting();
            if (nextWl != null) {
                Seat seat = allocationStrategy.selectSeat(trainClass, nextWl.getPassenger(), true);
                if (seat != null) {
                    seat.allocate(nextWl.getTicketId());
                    nextWl.setSeat(seat);
                    nextWl.setStatus(TicketStatus.CONFIRMED);
                    promotionLog.add(String.format("Promoted %s (%s) from WAITING -> CONFIRMED (%s)",
                            nextWl.getTicketId(), nextWl.getPnr(), seat.getSeatLabel()));
                }
            }
        }
    }

    private void promoteWaitingToRac(WaitingListManager wlm, List<String> promotionLog) {
        if (wlm.canAcceptRac()) {
            Ticket nextWl = wlm.pollNextWaiting();
            if (nextWl != null) {
                wlm.enqueueRac(nextWl);
                promotionLog.add(String.format("Promoted %s (%s) from WAITING -> RAC-%d",
                        nextWl.getTicketId(), nextWl.getPnr(), nextWl.getQueuePosition()));
            }
        }
    }
}
