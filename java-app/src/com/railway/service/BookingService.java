package com.railway.service;

import com.railway.exception.InvalidInputException;
import com.railway.exception.InvalidPNRException;
import com.railway.exception.SeatUnavailableException;
import com.railway.exception.TrainNotFoundException;
import com.railway.model.Booking;
import com.railway.model.ClassType;
import com.railway.model.Gender;
import com.railway.model.Passenger;
import com.railway.model.Seat;
import com.railway.model.Ticket;
import com.railway.model.TicketStatus;
import com.railway.model.Train;
import com.railway.model.TrainClass;
import com.railway.util.IdGenerator;
import com.railway.util.ValidationUtil;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Handles availability checks, atomic ticket booking, PNR lookup, chart generation, and user history.
 * Uses fine-grained per-train-and-class ReentrantLocks to prevent double seat allocation.
 */
public class BookingService {
    private final TrainRepository trainRepository;
    private final BookingRepository bookingRepository;
    private final IdGenerator idGenerator;
    private final SeatAllocationStrategy allocationStrategy;

    public record AvailabilityInfo(
            String trainId,
            String trainName,
            ClassType classType,
            double fare,
            int availableConfirmed,
            int availableRac,
            int availableWaiting,
            int totalCapacity
    ) {}

    public BookingService(TrainRepository trainRepository,
                          BookingRepository bookingRepository,
                          IdGenerator idGenerator,
                          SeatAllocationStrategy allocationStrategy) {
        this.trainRepository = trainRepository;
        this.bookingRepository = bookingRepository;
        this.idGenerator = idGenerator;
        this.allocationStrategy = allocationStrategy;
    }

    public AvailabilityInfo checkAvailability(String trainId, ClassType classType)
            throws TrainNotFoundException, InvalidInputException {
        Train train = trainRepository.findById(trainId);
        TrainClass trainClass = train.getTrainClass(classType);

        ReentrantLock lock = trainClass.getLock();
        lock.lock();
        try {
            return new AvailabilityInfo(
                    train.getTrainId(),
                    train.getName(),
                    classType,
                    trainClass.getFare(),
                    trainClass.getAvailableConfirmedCount(),
                    trainClass.getWaitingListManager().getAvailableRacSlots(),
                    trainClass.getWaitingListManager().getAvailableWaitingSlots(),
                    trainClass.getSeatCapacity()
            );
        } finally {
            lock.unlock();
        }
    }

    public Booking bookTickets(String userId, String trainId, ClassType classType, List<Passenger> passengers)
            throws TrainNotFoundException, InvalidInputException, SeatUnavailableException {
        return bookTickets(userId, trainId, classType, passengers, LocalDateTime.now());
    }

    public Booking bookTickets(String userId, String trainId, ClassType classType,
                               List<Passenger> passengers, LocalDateTime bookingTime)
            throws TrainNotFoundException, InvalidInputException, SeatUnavailableException {
        ValidationUtil.validateNonBlank(userId, "User ID");
        ValidationUtil.validatePassengers(passengers);
        if (classType == null) {
            throw new InvalidInputException("Class type is required.");
        }

        Train train = trainRepository.findById(trainId);
        if (!bookingTime.isBefore(train.getDepartureTime())) {
            throw new SeatUnavailableException(
                    "Booking closed: train " + train.getTrainId()
                            + " already departed at " + train.getDepartureTime() + ".");
        }

        TrainClass trainClass = train.getTrainClass(classType);
        ReentrantLock lock = trainClass.getLock();
        lock.lock();
        try {
            int requested = passengers.size();
            int totalAvailable = trainClass.getTotalRemainingCapacity();
            if (totalAvailable < requested) {
                throw new SeatUnavailableException(
                        String.format("Requested %d ticket(s) in %s on %s, but only %d total slots remain "
                                        + "(Confirmed:%d, RAC:%d, WL:%d).",
                                requested, classType.getCode(), train.getTrainId(), totalAvailable,
                                trainClass.getAvailableConfirmedCount(),
                                trainClass.getWaitingListManager().getAvailableRacSlots(),
                                trainClass.getWaitingListManager().getAvailableWaitingSlots()));
            }

            String pnr = idGenerator.nextPnr();
            double farePerTicket = trainClass.getFare();
            boolean singlePassengerBooking = requested == 1;

            List<Integer> allocationOrder = buildPriorityAllocationOrder(passengers, singlePassengerBooking);
            Ticket[] createdTickets = new Ticket[requested];
            WaitingListManager wlm = trainClass.getWaitingListManager();

            for (int idx : allocationOrder) {
                Passenger passenger = passengers.get(idx);
                String ticketId = idGenerator.nextTicketId();
                Ticket ticket = new Ticket(ticketId, pnr, train.getTrainId(), classType,
                        passenger, farePerTicket, TicketStatus.CONFIRMED);

                Seat seat = allocationStrategy.selectSeat(trainClass, passenger, singlePassengerBooking);
                if (seat != null) {
                    seat.allocate(ticketId);
                    ticket.setSeat(seat);
                    ticket.setStatus(TicketStatus.CONFIRMED);
                } else if (wlm.canAcceptRac()) {
                    wlm.enqueueRac(ticket);
                } else if (wlm.canAcceptWaiting()) {
                    wlm.enqueueWaiting(ticket);
                } else {
                    throw new SeatUnavailableException("Waiting list is full for " + classType.getCode());
                }
                createdTickets[idx] = ticket;
            }

            List<Ticket> ticketList = Arrays.asList(createdTickets);
            double totalFare = Math.round((farePerTicket * requested) * 100.0) / 100.0;
            Booking booking = new Booking(pnr, userId.trim(), train.getTrainId(),
                    classType, bookingTime, ticketList, totalFare);

            bookingRepository.save(booking);
            return booking;
        } finally {
            lock.unlock();
        }
    }

    public Booking getPnrStatus(String pnr)
            throws InvalidPNRException, TrainNotFoundException, InvalidInputException {
        Booking booking = bookingRepository.findByPnr(pnr);
        Train train = trainRepository.findById(booking.getTrainId());
        TrainClass trainClass = train.getTrainClass(booking.getClassType());

        ReentrantLock lock = trainClass.getLock();
        lock.lock();
        try {
            return booking;
        } finally {
            lock.unlock();
        }
    }

    public List<Booking> getUserBookingHistory(String userId) throws InvalidInputException {
        ValidationUtil.validateNonBlank(userId, "User ID");
        return bookingRepository.findByUserId(userId);
    }

    public String generateTrainChart(String trainId) throws TrainNotFoundException {
        Train train = trainRepository.findById(trainId);
        List<ReentrantLock> acquiredLocks = new ArrayList<>();

        for (ClassType type : ClassType.values()) {
            TrainClass tc = train.getClasses().get(type);
            if (tc != null) {
                tc.getLock().lock();
                acquiredLocks.add(tc.getLock());
            }
        }

        try {
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("=== RESERVATION CHART: %s - %s (%s -> %s, Departs: %s) ===%n",
                    train.getTrainId(), train.getName(), train.getSource(),
                    train.getDestination(), train.getDepartureTime()));

            for (ClassType type : ClassType.values()) {
                TrainClass tc = train.getClasses().get(type);
                if (tc == null) {
                    continue;
                }
                sb.append(String.format("%n--- Class %s (%s) | Capacity: %d | Fare: Rs. %.2f ---%n",
                        type.getCode(), type.getDisplayName(), tc.getSeatCapacity(), tc.getFare()));

                sb.append("  Confirmed Seats:\n");
                boolean anyConfirmed = false;
                for (Seat seat : tc.getSeats()) {
                    if (seat.isBooked()) {
                        anyConfirmed = true;
                        Ticket ticket = findTicketById(seat.getAssignedTicketId());
                        String passengerInfo = ticket != null
                                ? ticket.getPnr() + " | " + ticket.getPassenger()
                                : seat.getAssignedTicketId();
                        sb.append(String.format("    %-18s -> %s%n", seat.getSeatLabel(), passengerInfo));
                    }
                }
                if (!anyConfirmed) {
                    sb.append("    (None)\n");
                }

                List<Ticket> racList = tc.getWaitingListManager().getRacSnapshot();
                sb.append("  RAC Queue:\n");
                if (racList.isEmpty()) {
                    sb.append("    (None)\n");
                } else {
                    for (Ticket t : racList) {
                        sb.append(String.format("    RAC-%-3d -> %s | %s | %s%n",
                                t.getQueuePosition(), t.getPnr(), t.getTicketId(), t.getPassenger()));
                    }
                }

                List<Ticket> wlList = tc.getWaitingListManager().getWaitingSnapshot();
                sb.append("  Waiting List:\n");
                if (wlList.isEmpty()) {
                    sb.append("    (None)\n");
                } else {
                    for (Ticket t : wlList) {
                        sb.append(String.format("    WL-%-4d -> %s | %s | %s%n",
                                t.getQueuePosition(), t.getPnr(), t.getTicketId(), t.getPassenger()));
                    }
                }
            }
            return sb.toString();
        } finally {
            for (int i = acquiredLocks.size() - 1; i >= 0; i--) {
                acquiredLocks.get(i).unlock();
            }
        }
    }

    private Ticket findTicketById(String ticketId) {
        for (Booking b : bookingRepository.findAll()) {
            for (Ticket t : b.getTickets()) {
                if (t.getTicketId().equals(ticketId)) {
                    return t;
                }
            }
        }
        return null;
    }

    private List<Integer> buildPriorityAllocationOrder(List<Passenger> passengers, boolean singlePassenger) {
        List<Integer> priority = new ArrayList<>();
        List<Integer> regular = new ArrayList<>();
        for (int i = 0; i < passengers.size(); i++) {
            Passenger p = passengers.get(i);
            boolean isPriority = p.isSenior() || (p.getGender() == Gender.FEMALE && singlePassenger);
            if (isPriority) {
                priority.add(i);
            } else {
                regular.add(i);
            }
        }
        priority.addAll(regular);
        return priority;
    }
}
