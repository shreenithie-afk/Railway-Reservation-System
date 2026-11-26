package com.railway.service;

import com.railway.exception.SeatUnavailableException;
import com.railway.model.BerthType;
import com.railway.model.Booking;
import com.railway.model.ClassType;
import com.railway.model.Gender;
import com.railway.model.Passenger;
import com.railway.model.Seat;
import com.railway.model.Ticket;
import com.railway.model.Train;
import com.railway.model.TrainClass;
import com.railway.util.IdGenerator;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Automated concurrency stress test verifying:
 * 1) 60 threads racing for the last 5 seats (zero double-booking).
 * 2) Mixed concurrent bookings & cancellations preserving capacity, uniqueness, and FIFO WL invariants.
 */
public class ConcurrencyStressTest {

    public String runAllTests() {
        StringBuilder report = new StringBuilder();
        report.append("=== CONCURRENCY STRESS TEST SUITE ===\n");
        report.append(runLastFiveSeatsRaceTest()).append("\n");
        report.append(runMixedBookingAndCancellationTest());
        return report.toString();
    }

    private String runLastFiveSeatsRaceTest() {
        TrainRepository trainRepo = new TrainRepository();
        BookingRepository bookingRepo = new BookingRepository();
        IdGenerator idGen = new IdGenerator();
        SeatAllocationStrategy strategy = new PriorityBerthAllocationStrategy();
        BookingService bookingService = new BookingService(trainRepo, bookingRepo, idGen, strategy);

        TrainClass sl = new TrainClass(ClassType.SL, 5, 450.0, 0, 0);
        Train raceTrain = new Train("RACE-01", "Concurrency Express", "City A", "City B",
                LocalDateTime.now().plusDays(3), Map.of(ClassType.SL, sl));
        trainRepo.save(raceTrain);

        int threadCount = 60;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        ConcurrentHashMap<String, Ticket> winners = new ConcurrentHashMap<>();
        AtomicInteger rejectedCount = new AtomicInteger(0);
        AtomicInteger unexpectedErrors = new AtomicInteger(0);

        for (int i = 1; i <= threadCount; i++) {
            final int workerId = i;
            executor.submit(() -> {
                try {
                    startGate.await();
                    Passenger p = new Passenger("Racer-" + workerId, 25 + (workerId % 45),
                            (workerId % 2 == 0) ? Gender.FEMALE : Gender.MALE, BerthType.LOWER);
                    Booking booking = bookingService.bookTickets("user" + workerId, "RACE-01",
                            ClassType.SL, List.of(p));
                    winners.put("Thread-" + workerId, booking.getTickets().get(0));
                } catch (SeatUnavailableException e) {
                    rejectedCount.incrementAndGet();
                } catch (Exception e) {
                    unexpectedErrors.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startGate.countDown();
        awaitTermination(executor, doneLatch);

        Set<Integer> assignedSeats = new HashSet<>();
        StringBuilder sb = new StringBuilder();
        sb.append("[Test 1] 60 Threads Racing for Last 5 Seats:\n");
        List<String> sortedWinners = new ArrayList<>(winners.keySet());
        Collections.sort(sortedWinners);
        for (String threadName : sortedWinners) {
            Ticket t = winners.get(threadName);
            int seatNo = t.getSeat().getSeatNumber();
            assignedSeats.add(seatNo);
            sb.append(String.format("  %-10s -> PNR: %s | %s | Seat: %s%n",
                    threadName, t.getPnr(), t.getTicketId(), t.getSeat().getSeatLabel()));
        }

        boolean passed = winners.size() == 5
                && assignedSeats.size() == 5
                && rejectedCount.get() == 55
                && unexpectedErrors.get() == 0;

        sb.append(String.format("  Summary: Confirmed=%d, Rejected=%d, UniqueSeats=%d, Errors=%d -> %s%n",
                winners.size(), rejectedCount.get(), assignedSeats.size(), unexpectedErrors.get(),
                passed ? "PASS (Each seat 1..5 assigned exactly once)" : "FAIL"));
        return sb.toString();
    }

    private String runMixedBookingAndCancellationTest() {
        TrainRepository trainRepo = new TrainRepository();
        BookingRepository bookingRepo = new BookingRepository();
        IdGenerator idGen = new IdGenerator();
        SeatAllocationStrategy strategy = new PriorityBerthAllocationStrategy();
        BookingService bookingService = new BookingService(trainRepo, bookingRepo, idGen, strategy);
        CancellationService cancellationService = new CancellationService(
                trainRepo, bookingRepo, strategy, new RefundCalculator(new StandardRefundPolicy()));

        int capacity = 12;
        int racLimit = 5;
        int wlLimit = 15;
        TrainClass threeA = new TrainClass(ClassType.THREE_A, capacity, 1200.0, racLimit, wlLimit);
        Train mixedTrain = new Train("MIX-02", "Invariant Shatabdi", "Delhi", "Mumbai",
                LocalDateTime.now().plusDays(4), Map.of(ClassType.THREE_A, threeA));
        trainRepo.save(mixedTrain);

        int bookers = 35;
        int cancellers = 15;
        ExecutorService executor = Executors.newFixedThreadPool(25);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(bookers + cancellers);

        ConcurrentLinkedQueue<String> pnrPool = new ConcurrentLinkedQueue<>();
        AtomicInteger successfulBookings = new AtomicInteger(0);
        AtomicInteger successfulCancels = new AtomicInteger(0);

        for (int i = 1; i <= bookers; i++) {
            final int id = i;
            executor.submit(() -> {
                try {
                    startGate.await();
                    int count = 1 + (id % 2);
                    List<Passenger> pax = new ArrayList<>();
                    for (int j = 0; j < count; j++) {
                        pax.add(new Passenger("Pax-" + id + "-" + j, 30 + (id % 40),
                                (j == 0 && id % 3 == 0) ? Gender.FEMALE : Gender.MALE, BerthType.LOWER));
                    }
                    Booking b = bookingService.bookTickets("u" + id, "MIX-02", ClassType.THREE_A, pax);
                    pnrPool.offer(b.getPnr());
                    successfulBookings.incrementAndGet();
                } catch (Exception ignored) {
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        for (int i = 1; i <= cancellers; i++) {
            executor.submit(() -> {
                try {
                    startGate.await();
                    Thread.sleep(ThreadLocalRandom.current().nextInt(1, 15));
                    String pnr = pnrPool.poll();
                    if (pnr != null) {
                        Booking b = bookingRepo.findByPnr(pnr);
                        if (b.getTickets().size() > 1) {
                            cancellationService.cancelTickets(pnr, List.of(b.getTickets().get(0).getTicketId()));
                        } else {
                            cancellationService.cancelFullPnr(pnr);
                        }
                        successfulCancels.incrementAndGet();
                    }
                } catch (Exception ignored) {
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startGate.countDown();
        awaitTermination(executor, doneLatch);

        threeA.getLock().lock();
        try {
            int confirmed = 0;
            int rac = 0;
            int waiting = 0;
            int cancelled = 0;
            Set<Integer> seatNumbers = new HashSet<>();
            boolean duplicateSeat = false;

            for (Booking b : bookingRepo.findAll()) {
                for (Ticket t : b.getTickets()) {
                    switch (t.getStatus()) {
                        case CONFIRMED -> {
                            confirmed++;
                            if (t.getSeat() == null || !seatNumbers.add(t.getSeat().getSeatNumber())) {
                                duplicateSeat = true;
                            }
                        }
                        case RAC -> rac++;
                        case WAITING -> waiting++;
                        case CANCELLED -> cancelled++;
                    }
                }
            }

            int occupiedSeatsInTrain = 0;
            for (Seat s : threeA.getSeats()) {
                if (s.isBooked()) {
                    occupiedSeatsInTrain++;
                }
            }

            List<Ticket> racSnapshot = threeA.getWaitingListManager().getRacSnapshot();
            List<Ticket> wlSnapshot = threeA.getWaitingListManager().getWaitingSnapshot();
            boolean racOrderValid = isSequentialPositions(racSnapshot);
            boolean wlOrderValid = isSequentialPositions(wlSnapshot);

            boolean invariantsHold = (confirmed <= capacity)
                    && (confirmed == occupiedSeatsInTrain)
                    && !duplicateSeat
                    && (rac <= racLimit)
                    && (waiting <= wlLimit)
                    && (rac == racSnapshot.size())
                    && (waiting == wlSnapshot.size())
                    && racOrderValid
                    && wlOrderValid;

            return String.format(
                    "[Test 2] Concurrent Bookings (%d ok) + Cancellations (%d ok):\n"
                            + "  Confirmed: %d/%d | Occupied Seats: %d | Duplicate Seats: %s\n"
                            + "  RAC: %d/%d (FIFO valid: %s) | Waiting: %d/%d (FIFO valid: %s) | Cancelled: %d\n"
                            + "  Invariants Check -> %s%n",
                    successfulBookings.get(), successfulCancels.get(),
                    confirmed, capacity, occupiedSeatsInTrain, duplicateSeat,
                    rac, racLimit, racOrderValid, waiting, wlLimit, wlOrderValid, cancelled,
                    invariantsHold ? "PASS (All invariants verified)" : "FAIL");
        } finally {
            threeA.getLock().unlock();
        }
    }

    private boolean isSequentialPositions(List<Ticket> queue) {
        for (int i = 0; i < queue.size(); i++) {
            if (queue.get(i).getQueuePosition() != i + 1) {
                return false;
            }
        }
        return true;
    }

    private void awaitTermination(ExecutorService executor, CountDownLatch doneLatch) {
        try {
            doneLatch.await(15, TimeUnit.SECONDS);
            executor.shutdown();
            executor.awaitTermination(5, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            executor.shutdownNow();
        }
    }
}
