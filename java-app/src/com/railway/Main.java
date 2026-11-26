package com.railway;

import com.railway.exception.RailwayException;
import com.railway.model.BerthType;
import com.railway.model.Booking;
import com.railway.model.ClassType;
import com.railway.model.Gender;
import com.railway.model.Passenger;
import com.railway.model.Ticket;
import com.railway.model.Train;
import com.railway.model.TrainClass;
import com.railway.service.BookingRepository;
import com.railway.service.BookingService;
import com.railway.service.CancellationService;
import com.railway.service.ConcurrencyStressTest;
import com.railway.service.PriorityBerthAllocationStrategy;
import com.railway.service.RefundCalculator;
import com.railway.service.SeatAllocationStrategy;
import com.railway.service.StandardRefundPolicy;
import com.railway.service.TrainRepository;
import com.railway.util.IdGenerator;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;

/**
 * Console entry point for the Railway Reservation & Ticket Cancellation System.
 */
public class Main {
    private static final DateTimeFormatter DT_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public static void main(String[] args) {
        TrainRepository trainRepository = new TrainRepository();
        BookingRepository bookingRepository = new BookingRepository();
        IdGenerator idGenerator = new IdGenerator();
        SeatAllocationStrategy allocationStrategy = new PriorityBerthAllocationStrategy();
        RefundCalculator refundCalculator = new RefundCalculator(new StandardRefundPolicy());

        BookingService bookingService = new BookingService(
                trainRepository, bookingRepository, idGenerator, allocationStrategy);
        CancellationService cancellationService = new CancellationService(
                trainRepository, bookingRepository, allocationStrategy, refundCalculator);
        ConcurrencyStressTest stressTest = new ConcurrencyStressTest();

        preloadSampleTrains(trainRepository);

        try (Scanner scanner = new Scanner(System.in)) {
            boolean running = true;
            while (running) {
                printMenu(trainRepository);
                String choice = scanner.nextLine().trim();
                switch (choice) {
                    case "1" -> handleCheckAvailability(scanner, bookingService);
                    case "2" -> handleBookTickets(scanner, bookingService);
                    case "3" -> handleCancelTickets(scanner, cancellationService);
                    case "4" -> handleCheckPnr(scanner, bookingService);
                    case "5" -> handleViewChart(scanner, bookingService);
                    case "6" -> handleViewHistory(scanner, bookingService);
                    case "7" -> System.out.println("\n" + stressTest.runAllTests());
                    case "8" -> {
                        running = false;
                        System.out.println("Exiting Railway Reservation System. Goodbye!");
                    }
                    default -> System.out.println("Invalid option. Please select 1-8.");
                }
            }
        }
    }

    private static void preloadSampleTrains(TrainRepository trainRepo) {
        LocalDateTime now = LocalDateTime.now();

        Map<ClassType, TrainClass> rajdhaniClasses = new EnumMap<>(ClassType.class);
        rajdhaniClasses.put(ClassType.SL, new TrainClass(ClassType.SL, 4, 480.0, 2, 3));
        rajdhaniClasses.put(ClassType.THREE_A, new TrainClass(ClassType.THREE_A, 6, 1350.0, 2, 2));
        rajdhaniClasses.put(ClassType.TWO_A, new TrainClass(ClassType.TWO_A, 4, 1980.0, 1, 2));
        rajdhaniClasses.put(ClassType.ONE_A, new TrainClass(ClassType.ONE_A, 2, 3250.0, 0, 2));
        trainRepo.save(new Train("12951", "Mumbai Rajdhani", "Mumbai", "New Delhi",
                now.plusDays(3), rajdhaniClasses));

        Map<ClassType, TrainClass> shatabdiClasses = new EnumMap<>(ClassType.class);
        shatabdiClasses.put(ClassType.SL, new TrainClass(ClassType.SL, 8, 420.0, 2, 4));
        shatabdiClasses.put(ClassType.THREE_A, new TrainClass(ClassType.THREE_A, 6, 1150.0, 2, 3));
        shatabdiClasses.put(ClassType.TWO_A, new TrainClass(ClassType.TWO_A, 4, 1750.0, 1, 2));
        trainRepo.save(new Train("12002", "Bhopal Shatabdi", "New Delhi", "Bhopal",
                now.plusHours(24), shatabdiClasses));

        Map<ClassType, TrainClass> expressClasses = new EnumMap<>(ClassType.class);
        expressClasses.put(ClassType.SL, new TrainClass(ClassType.SL, 6, 360.0, 2, 3));
        expressClasses.put(ClassType.THREE_A, new TrainClass(ClassType.THREE_A, 4, 980.0, 1, 2));
        trainRepo.save(new Train("12627", "Karnataka Express", "Bengaluru", "New Delhi",
                now.plusHours(6), expressClasses));

        Map<ClassType, TrainClass> departedClasses = new EnumMap<>(ClassType.class);
        departedClasses.put(ClassType.SL, new TrainClass(ClassType.SL, 4, 300.0, 1, 1));
        trainRepo.save(new Train("12124", "Deccan Queen (Departed)", "Pune", "Mumbai",
                now.minusHours(2), departedClasses));
    }

    private static void printMenu(TrainRepository trainRepo) {
        System.out.println("\n================ RAILWAY RESERVATION SYSTEM ================");
        System.out.println("Available Trains:");
        for (Train t : trainRepo.findAll()) {
            System.out.printf("  [%s] %-24s | %s -> %s | Departs: %s%n",
                    t.getTrainId(), t.getName(), t.getSource(), t.getDestination(),
                    t.getDepartureTime().format(DT_FMT));
        }
        System.out.println("------------------------------------------------------------");
        System.out.println("1. Check Seat Availability");
        System.out.println("2. Book Tickets");
        System.out.println("3. Cancel Tickets (Full PNR / Partial)");
        System.out.println("4. Check PNR Status");
        System.out.println("5. View Train Chart");
        System.out.println("6. View User Booking History");
        System.out.println("7. Run Concurrency Stress Test");
        System.out.println("8. Exit");
        System.out.print("Select an option (1-8): ");
    }

    private static void handleCheckAvailability(Scanner scanner, BookingService bookingService) {
        try {
            System.out.print("Enter Train ID: ");
            String trainId = scanner.nextLine();
            System.out.print("Enter Class (SL, 3A, 2A, 1A): ");
            ClassType classType = ClassType.fromCode(scanner.nextLine());

            BookingService.AvailabilityInfo info = bookingService.checkAvailability(trainId, classType);
            System.out.printf("%nTrain: %s (%s) | Class: %s (%s) | Fare: Rs. %.2f%n",
                    info.trainId(), info.trainName(), info.classType().getCode(),
                    info.classType().getDisplayName(), info.fare());
            System.out.printf("Confirmed Available: %d/%d | RAC Slots Free: %d | WL Slots Free: %d%n",
                    info.availableConfirmed(), info.totalCapacity(),
                    info.availableRac(), info.availableWaiting());
        } catch (RailwayException e) {
            System.out.println("Error: " + e.getMessage());
        }
    }

    private static void handleBookTickets(Scanner scanner, BookingService bookingService) {
        try {
            System.out.print("Enter User ID: ");
            String userId = scanner.nextLine();
            System.out.print("Enter Train ID: ");
            String trainId = scanner.nextLine();
            System.out.print("Enter Class (SL, 3A, 2A, 1A): ");
            ClassType classType = ClassType.fromCode(scanner.nextLine());

            System.out.print("Number of passengers (1-6): ");
            int count;
            try {
                count = Integer.parseInt(scanner.nextLine().trim());
            } catch (NumberFormatException e) {
                System.out.println("Error: Please enter a valid integer for passenger count.");
                return;
            }
            if (count < 1 || count > 6) {
                System.out.println("Error: Passenger count must be between 1 and 6.");
                return;
            }

            List<Passenger> passengers = new ArrayList<>();
            for (int i = 1; i <= count; i++) {
                System.out.println("-- Passenger " + i + " --");
                System.out.print("  Name: ");
                String name = scanner.nextLine();
                System.out.print("  Age: ");
                int age;
                try {
                    age = Integer.parseInt(scanner.nextLine().trim());
                } catch (NumberFormatException e) {
                    System.out.println("Error: Age must be a valid integer.");
                    return;
                }
                System.out.print("  Gender (M/F/O): ");
                Gender gender = Gender.fromInput(scanner.nextLine());
                System.out.print("  Berth Preference (LOWER, MIDDLE, UPPER, SIDE, NONE): ");
                BerthType pref = BerthType.fromInput(scanner.nextLine());
                passengers.add(new Passenger(name, age, gender, pref));
            }

            Booking booking = bookingService.bookTickets(userId, trainId, classType, passengers);
            System.out.println("\nBooking Successful!");
            printBookingDetails(booking);
        } catch (RailwayException e) {
            System.out.println("Booking Failed: " + e.getMessage());
        }
    }

    private static void handleCancelTickets(Scanner scanner, CancellationService cancellationService) {
        try {
            System.out.print("Enter PNR to cancel: ");
            String pnr = scanner.nextLine();
            System.out.print("Cancel entire PNR? (Y/N): ");
            String full = scanner.nextLine().trim();

            CancellationService.CancellationResult result;
            if (full.equalsIgnoreCase("Y")) {
                result = cancellationService.cancelFullPnr(pnr);
            } else {
                System.out.print("Enter comma-separated Ticket IDs to cancel (e.g., TKT500001,TKT500002): ");
                String rawIds = scanner.nextLine();
                List<String> ticketIds = Arrays.stream(rawIds.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();
                result = cancellationService.cancelTickets(pnr, ticketIds);
            }

            System.out.printf("%nCancellation Complete for PNR %s. Total Refund: Rs. %.2f%n",
                    result.pnr(), result.totalRefund());
            for (Ticket t : result.cancelledTickets()) {
                System.out.println("  Cancelled -> " + t);
            }
            if (!result.promotionLog().isEmpty()) {
                System.out.println("  Automatic Promotions:");
                result.promotionLog().forEach(msg -> System.out.println("    * " + msg));
            }
        } catch (RailwayException e) {
            System.out.println("Cancellation Failed: " + e.getMessage());
        }
    }

    private static void handleCheckPnr(Scanner scanner, BookingService bookingService) {
        try {
            System.out.print("Enter PNR: ");
            Booking booking = bookingService.getPnrStatus(scanner.nextLine());
            printBookingDetails(booking);
        } catch (RailwayException e) {
            System.out.println("Error: " + e.getMessage());
        }
    }

    private static void handleViewChart(Scanner scanner, BookingService bookingService) {
        try {
            System.out.print("Enter Train ID: ");
            String chart = bookingService.generateTrainChart(scanner.nextLine());
            System.out.println("\n" + chart);
        } catch (RailwayException e) {
            System.out.println("Error: " + e.getMessage());
        }
    }

    private static void handleViewHistory(Scanner scanner, BookingService bookingService) {
        try {
            System.out.print("Enter User ID: ");
            List<Booking> history = bookingService.getUserBookingHistory(scanner.nextLine());
            if (history.isEmpty()) {
                System.out.println("No bookings found for this user.");
                return;
            }
            System.out.println("\n=== BOOKING HISTORY ===");
            for (Booking b : history) {
                printBookingDetails(b);
            }
        } catch (RailwayException e) {
            System.out.println("Error: " + e.getMessage());
        }
    }

    private static void printBookingDetails(Booking booking) {
        System.out.printf("PNR: %s | User: %s | Train: %s (%s) | Booked: %s | Total Fare: Rs. %.2f | [%s]%n",
                booking.getPnr(), booking.getUserId(), booking.getTrainId(),
                booking.getClassType().getCode(), booking.getBookedAt().format(DT_FMT),
                booking.getTotalFare(), booking.getOverallStatusSummary());
        for (Ticket t : booking.getTickets()) {
            System.out.println("  " + t);
        }
    }
}
