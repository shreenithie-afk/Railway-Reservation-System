export interface JavaSourceFile {
  id: string;
  pkg: 'model' | 'exception' | 'util' | 'service' | 'root';
  fileName: string;
  filePath: string;
  summary: string;
  code: string;
}

export const ARCHITECTURE_OVERVIEW = `1. Architecture Overview

The Railway Reservation & Ticket Cancellation System follows a layered, SOLID-compliant architecture built with Java 17+ standard libraries only (java.util.concurrent, java.time, java.util.concurrent.locks).

- model (com.railway.model): Domain entities and enums (Train, TrainClass, Seat, Passenger, Ticket, Booking, ClassType, BerthType, Gender, TicketStatus). Each TrainClass owns its own ReentrantLock and WaitingListManager so locking is strictly scoped per (train, class).
- service (com.railway.service):
  - Repositories: TrainRepository and BookingRepository backed by ConcurrentHashMap for thread-safe O(1) lookups.
  - Strategy Pattern: SeatAllocationStrategy (PriorityBerthAllocationStrategy) and RefundPolicy (StandardRefundPolicy) allow allocation and refund rules to evolve independently.
  - Core Services: BookingService, CancellationService, WaitingListManager, RefundCalculator, and ConcurrencyStressTest.
- exception (com.railway.exception): Checked domain exception hierarchy rooted at RailwayException.
- util (com.railway.util): Thread-safe IdGenerator (AtomicLong) and ValidationUtil.
- com.railway.Main: Menu-driven CLI with pre-loaded sample trains across multiple departure windows.`;

export const CLASS_DIAGRAM_ASCII = `+-----------------------------------------------------------------------------+
|                              com.railway.Main                               |
|  - Menu CLI, pre-loaded sample trains, interactive I/O                      |
+--------------------------------------+--------------------------------------+
                                       | uses
          +----------------------------+----------------------------+
          v                            v                            v
+-------------------+       +---------------------+      +--------------------+
|  BookingService   |       | CancellationService |      | ConcurrencyStress  |
|-------------------|       |---------------------|      | Test               |
| +checkAvailability|       | +cancelFullPnr()    |      | +runAllTests()     |
| +bookTickets()    |       | +cancelTickets()    |      +--------------------+
| +getPnrStatus()   |       +----------+----------+
| +getTrainChart()  |                  | uses
| +getUserHistory() |                  +-------------------+
+---------+---------+                  v                   v
          | uses            +--------------------+  +------------------+
          |                 |  RefundCalculator  |  | <<interface>>    |
          |                 |--------------------|  | RefundPolicy     |
          v                 | -policy            |->|------------------|
+--------------------+      +--------------------+  | +calculateRefund |
| <<interface>>      |                              +--------+---------+
| SeatAllocation     |<--+                                   ^
| Strategy           |   | implements                        |
+--------------------+   |                          +--------+---------+
                         |                          | StandardRefund   |
             +-----------+--------------+           | Policy           |
             | PriorityBerthAllocation  |           +------------------+
             | Strategy                 |
             +--------------------------+

+-------------------+     1      * +--------------------+     1    1 +--------------------+
|       Train       |------------->|     TrainClass     |----------->| WaitingListManager |
|-------------------|              |--------------------|            |--------------------|
| -trainId          |              | -classType         |            | -racQueue (FIFO)   |
| -name             |              | -fare, -capacity   |            | -waitingQueue(FIFO)|
| -source, -dest    |              | -lock:ReentrantLock|            +--------------------+
| -departureTime    |              | -seats: List<Seat> |
+-------------------+              +---------+----------+
                                             | 1..*
                                             v
+-------------------+     1      * +--------------------+     1    1 +--------------------+
|      Booking      |------------->|       Ticket       |----------->|     Passenger      |
|-------------------|              |--------------------|            |--------------------|
| -pnr, -userId     |              | -ticketId, -status |            | -name, -age        |
| -trainId          |              | -seat, -queuePos   |            | -gender            |
| -classType        |              | -fare, -refundAmt  |            | -berthPreference   |
+-------------------+              +--------------------+            +--------------------+`;

export const COMPILE_RUN_INSTRUCTIONS = `Compile and Run (Java 17+)

Linux / macOS:
  mkdir -p out
  javac --release 17 -d out $(find src -name "*.java")
  java -cp out com.railway.Main

Windows (PowerShell / CMD):
  mkdir out
  dir /s /b src\\*.java > sources.txt
  javac --release 17 -d out @sources.txt
  java -cp out com.railway.Main`;

export const SAMPLE_OUTPUT = `================ RAILWAY RESERVATION SYSTEM ================
Available Trains:
  [12951] Mumbai Rajdhani          | Mumbai -> New Delhi | Departs: 2026-11-29 06:23
  [12002] Bhopal Shatabdi          | New Delhi -> Bhopal | Departs: 2026-11-27 06:23
  [12627] Karnataka Express        | Bengaluru -> New Delhi | Departs: 2026-11-26 12:23
  [12124] Deccan Queen (Departed)  | Pune -> Mumbai | Departs: 2026-11-26 04:23
------------------------------------------------------------
Select an option (1-8): 2
Booking Successful!
PNR: PNR100001 | User: alice | Train: 12951 (SL) | Total Fare: Rs. 960.00 | [CONFIRMED:2, RAC:0, WL:0, CANCELLED:0]
  [TKT500002] Rahul (30/M, Pref: Lower) | Fare: Rs. 480.00 | CONFIRMED | Seat S1-4 (Lower)
  [TKT500001] Meera (67/F, Pref: Lower) | Fare: Rs. 480.00 | CONFIRMED | Seat S1-1 (Lower)

Select an option (1-8): 7
=== CONCURRENCY STRESS TEST SUITE ===
[Test 1] 60 Threads Racing for Last 5 Seats:
  Thread-14  -> PNR: PNR100005 | TKT500005 | Seat: S1-4 (Lower)
  Thread-2   -> PNR: PNR100002 | TKT500002 | Seat: S1-2 (Middle)
  Thread-39  -> PNR: PNR100004 | TKT500004 | Seat: S1-3 (Upper)
  Thread-41  -> PNR: PNR100001 | TKT500001 | Seat: S1-1 (Lower)
  Thread-9   -> PNR: PNR100003 | TKT500003 | Seat: S1-5 (Middle)
  Summary: Confirmed=5, Rejected=55, UniqueSeats=5, Errors=0 -> PASS (Each seat 1..5 assigned exactly once)

[Test 2] Concurrent Bookings (35 ok) + Cancellations (15 ok):
  Confirmed: 12/12 | Occupied Seats: 12 | Duplicate Seats: false
  RAC: 5/5 (FIFO valid: true) | Waiting: 10/15 (FIFO valid: true) | Cancelled: 17
  Invariants Check -> PASS (All invariants verified)`;

export const CONCURRENCY_NOTE = `How Double Booking Is Prevented

1. Fine-Grained ReentrantLock per TrainClass: Every (trainId, classType) owns an independent ReentrantLock. Booking, cancellation, and RAC/waiting-list promotion for that class execute inside lock.lock() / finally { lock.unlock(); }. Operations on different trains or classes run in full parallel, while operations on the same class execute atomically.
2. All-or-Nothing Capacity Check: Before assigning any seat in a multi-passenger booking, BookingService checks totalRemainingCapacity >= requested under the lock, preventing partial seat leaks.
3. Deadlock Avoidance: Single-class operations acquire only one lock; cross-class operations (generateTrainChart) acquire locks in canonical ClassType enum order (SL -> 3A -> 2A -> 1A) and unlock in reverse order.
4. Lock-Free Counters & Concurrent Stores: AtomicLong generates unique PNRs and Ticket IDs without lock contention, while ConcurrentHashMap and CopyOnWriteArrayList protect shared stores.`;

export const JAVA_SOURCE_FILES: JavaSourceFile[] = [
  {
    id: 'ClassType',
    pkg: 'model',
    fileName: 'ClassType.java',
    filePath: 'src/com/railway/model/ClassType.java',
    summary: 'Coach class enum (SL, 3A, 2A, 1A) with code parsing.',
    code: `package com.railway.model;

import com.railway.exception.InvalidInputException;

/**
 * Supported railway coach classes.
 */
public enum ClassType {
    SL("Sleeper", "SL", "S"),
    THREE_A("AC 3 Tier", "3A", "B"),
    TWO_A("AC 2 Tier", "2A", "A"),
    ONE_A("First AC", "1A", "H");

    private final String displayName;
    private final String code;
    private final String coachPrefix;

    ClassType(String displayName, String code, String coachPrefix) {
        this.displayName = displayName;
        this.code = code;
        this.coachPrefix = coachPrefix;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getCode() {
        return code;
    }

    public String getCoachPrefix() {
        return coachPrefix;
    }

    public static ClassType fromCode(String input) throws InvalidInputException {
        if (input == null || input.isBlank()) {
            throw new InvalidInputException("Class type cannot be empty. Valid options: SL, 3A, 2A, 1A.");
        }
        String normalized = input.trim().toUpperCase();
        for (ClassType type : values()) {
            if (type.code.equals(normalized) || type.name().equals(normalized)) {
                return type;
            }
        }
        throw new InvalidInputException("Invalid class '" + input + "'. Valid options: SL, 3A, 2A, 1A.");
    }
}`
  },
  {
    id: 'BerthType',
    pkg: 'model',
    fileName: 'BerthType.java',
    filePath: 'src/com/railway/model/BerthType.java',
    summary: 'Physical berth types (Lower, Middle, Upper, Side).',
    code: `package com.railway.model;

import com.railway.exception.InvalidInputException;

/**
 * Available berth types inside a coach.
 */
public enum BerthType {
    LOWER("Lower"),
    MIDDLE("Middle"),
    UPPER("Upper"),
    SIDE("Side");

    private final String label;

    BerthType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    /**
     * Parses user input into a BerthType, returning null if user chooses no preference.
     */
    public static BerthType fromInput(String input) throws InvalidInputException {
        if (input == null || input.isBlank() || input.trim().equalsIgnoreCase("NONE")) {
            return null;
        }
        String normalized = input.trim().toUpperCase();
        return switch (normalized) {
            case "L", "LOWER", "1" -> LOWER;
            case "M", "MIDDLE", "2" -> MIDDLE;
            case "U", "UPPER", "3" -> UPPER;
            case "S", "SIDE", "4" -> SIDE;
            case "N", "NO", "5" -> null;
            default -> throw new InvalidInputException(
                    "Invalid berth preference '" + input + "'. Use LOWER, MIDDLE, UPPER, SIDE, or NONE.");
        };
    }
}`
  },
  {
    id: 'Gender',
    pkg: 'model',
    fileName: 'Gender.java',
    filePath: 'src/com/railway/model/Gender.java',
    summary: 'Passenger gender enum with input parser.',
    code: `package com.railway.model;

import com.railway.exception.InvalidInputException;

/**
 * Passenger gender options.
 */
public enum Gender {
    MALE,
    FEMALE,
    OTHER;

    public static Gender fromInput(String input) throws InvalidInputException {
        if (input == null || input.isBlank()) {
            throw new InvalidInputException("Gender cannot be empty. Valid options: M/MALE, F/FEMALE, O/OTHER.");
        }
        String normalized = input.trim().toUpperCase();
        return switch (normalized) {
            case "M", "MALE" -> MALE;
            case "F", "FEMALE" -> FEMALE;
            case "O", "OTHER" -> OTHER;
            default -> throw new InvalidInputException(
                    "Invalid gender '" + input + "'. Valid options: M/MALE, F/FEMALE, O/OTHER.");
        };
    }
}`
  },
  {
    id: 'TicketStatus',
    pkg: 'model',
    fileName: 'TicketStatus.java',
    filePath: 'src/com/railway/model/TicketStatus.java',
    summary: 'Ticket status states: CONFIRMED, RAC, WAITING, CANCELLED.',
    code: `package com.railway.model;

/**
 * Lifecycle states of a reservation ticket.
 */
public enum TicketStatus {
    CONFIRMED,
    RAC,
    WAITING,
    CANCELLED
}`
  },
  {
    id: 'Seat',
    pkg: 'model',
    fileName: 'Seat.java',
    filePath: 'src/com/railway/model/Seat.java',
    summary: 'Physical berth entity with allocate/release guards.',
    code: `package com.railway.model;

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
}`
  },
  {
    id: 'Passenger',
    pkg: 'model',
    fileName: 'Passenger.java',
    filePath: 'src/com/railway/model/Passenger.java',
    summary: 'Immutable passenger details and senior check.',
    code: `package com.railway.model;

/**
 * Immutable passenger details captured during booking.
 */
public class Passenger {
    private final String name;
    private final int age;
    private final Gender gender;
    private final BerthType berthPreference; // nullable when no preference

    public Passenger(String name, int age, Gender gender, BerthType berthPreference) {
        this.name = name;
        this.age = age;
        this.gender = gender;
        this.berthPreference = berthPreference;
    }

    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }

    public Gender getGender() {
        return gender;
    }

    public BerthType getBerthPreference() {
        return berthPreference;
    }

    public boolean isSenior() {
        return age >= 60;
    }

    @Override
    public String toString() {
        String pref = berthPreference != null ? berthPreference.getLabel() : "None";
        return String.format("%s (%d/%s, Pref: %s)", name, age, gender.name().charAt(0), pref);
    }
}`
  },
  {
    id: 'Ticket',
    pkg: 'model',
    fileName: 'Ticket.java',
    filePath: 'src/com/railway/model/Ticket.java',
    summary: 'Individual passenger ticket tracking status, seat, queue position, and refund.',
    code: `package com.railway.model;

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
}`
  },
  {
    id: 'Booking',
    pkg: 'model',
    fileName: 'Booking.java',
    filePath: 'src/com/railway/model/Booking.java',
    summary: 'PNR reservation grouping 1 to 6 tickets.',
    code: `package com.railway.model;

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
}`
  },
  {
    id: 'TrainClass',
    pkg: 'model',
    fileName: 'TrainClass.java',
    filePath: 'src/com/railway/model/TrainClass.java',
    summary: 'Per-class seats, fare, limits, WaitingListManager, and dedicated ReentrantLock.',
    code: `package com.railway.model;

import com.railway.service.WaitingListManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Represents a travel class (SL, 3A, 2A, 1A) on a specific train.
 * Holds a dedicated ReentrantLock for fine-grained per-train-and-class concurrency control.
 */
public class TrainClass {
    private final ClassType classType;
    private final int seatCapacity;
    private final double fare;
    private final int racLimit;
    private final int wlLimit;
    private final List<Seat> seats;
    private final WaitingListManager waitingListManager;
    private final ReentrantLock lock;

    public TrainClass(ClassType classType, int seatCapacity, double fare, int racLimit, int wlLimit) {
        if (seatCapacity < 0 || fare <= 0 || racLimit < 0 || wlLimit < 0) {
            throw new IllegalArgumentException("Invalid TrainClass configuration parameters.");
        }
        this.classType = classType;
        this.seatCapacity = seatCapacity;
        this.fare = fare;
        this.racLimit = racLimit;
        this.wlLimit = wlLimit;
        this.seats = initializeSeats(classType, seatCapacity);
        this.waitingListManager = new WaitingListManager(racLimit, wlLimit);
        this.lock = new ReentrantLock();
    }

    private List<Seat> initializeSeats(ClassType type, int capacity) {
        List<Seat> list = new ArrayList<>(capacity);
        BerthType[] pattern = switch (type) {
            case SL, THREE_A -> new BerthType[]{
                    BerthType.LOWER, BerthType.MIDDLE, BerthType.UPPER,
                    BerthType.LOWER, BerthType.MIDDLE, BerthType.UPPER,
                    BerthType.SIDE, BerthType.SIDE
            };
            case TWO_A -> new BerthType[]{
                    BerthType.LOWER, BerthType.UPPER,
                    BerthType.LOWER, BerthType.UPPER,
                    BerthType.SIDE, BerthType.SIDE
            };
            case ONE_A -> new BerthType[]{
                    BerthType.LOWER, BerthType.UPPER
            };
        };

        int seatsPerCoach = switch (type) {
            case SL, THREE_A -> 72;
            case TWO_A -> 48;
            case ONE_A -> 24;
        };

        for (int i = 0; i < capacity; i++) {
            int seatNo = i + 1;
            String coach = type.getCoachPrefix() + ((i / seatsPerCoach) + 1);
            BerthType berth = pattern[i % pattern.length];
            list.add(new Seat(seatNo, coach, berth));
        }
        return Collections.unmodifiableList(list);
    }

    public ClassType getClassType() {
        return classType;
    }

    public int getSeatCapacity() {
        return seatCapacity;
    }

    public double getFare() {
        return fare;
    }

    public int getRacLimit() {
        return racLimit;
    }

    public int getWlLimit() {
        return wlLimit;
    }

    public List<Seat> getSeats() {
        return seats;
    }

    public WaitingListManager getWaitingListManager() {
        return waitingListManager;
    }

    public ReentrantLock getLock() {
        return lock;
    }

    /**
     * Must be called with {@link #lock} held.
     */
    public int getAvailableConfirmedCount() {
        int available = 0;
        for (Seat seat : seats) {
            if (!seat.isBooked()) {
                available++;
            }
        }
        return available;
    }

    /**
     * Must be called with {@link #lock} held.
     */
    public int getTotalRemainingCapacity() {
        return getAvailableConfirmedCount()
                + waitingListManager.getAvailableRacSlots()
                + waitingListManager.getAvailableWaitingSlots();
    }
}`
  },
  {
    id: 'Train',
    pkg: 'model',
    fileName: 'Train.java',
    filePath: 'src/com/railway/model/Train.java',
    summary: 'Train schedule and class map.',
    code: `package com.railway.model;

import com.railway.exception.InvalidInputException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.EnumMap;
import java.util.Map;

/**
 * Represents a scheduled train with multiple travel classes.
 */
public class Train {
    private final String trainId;
    private final String name;
    private final String source;
    private final String destination;
    private final LocalDateTime departureTime;
    private final Map<ClassType, TrainClass> classes;

    public Train(String trainId, String name, String source, String destination,
                 LocalDateTime departureTime, Map<ClassType, TrainClass> classes) {
        this.trainId = trainId;
        this.name = name;
        this.source = source;
        this.destination = destination;
        this.departureTime = departureTime;
        EnumMap<ClassType, TrainClass> map = new EnumMap<>(ClassType.class);
        map.putAll(classes);
        this.classes = Collections.unmodifiableMap(map);
    }

    public String getTrainId() {
        return trainId;
    }

    public String getName() {
        return name;
    }

    public String getSource() {
        return source;
    }

    public String getDestination() {
        return destination;
    }

    public LocalDate getRunDate() {
        return departureTime.toLocalDate();
    }

    public LocalDateTime getDepartureTime() {
        return departureTime;
    }

    public Map<ClassType, TrainClass> getClasses() {
        return classes;
    }

    public TrainClass getTrainClass(ClassType classType) throws InvalidInputException {
        TrainClass tc = classes.get(classType);
        if (tc == null) {
            throw new InvalidInputException(
                    "Class " + classType.getCode() + " is not available on train " + trainId + ".");
        }
        return tc;
    }
}`
  },
  {
    id: 'RailwayException',
    pkg: 'exception',
    fileName: 'RailwayException.java',
    filePath: 'src/com/railway/exception/RailwayException.java',
    summary: 'Base checked exception for railway domain errors.',
    code: `package com.railway.exception;

/**
 * Base checked exception for all domain errors in the railway reservation system.
 */
public class RailwayException extends Exception {
    public RailwayException(String message) {
        super(message);
    }
}`
  },
  {
    id: 'SeatUnavailableException',
    pkg: 'exception',
    fileName: 'SeatUnavailableException.java',
    filePath: 'src/com/railway/exception/SeatUnavailableException.java',
    summary: 'Thrown when confirmed, RAC, and WL capacity is exhausted.',
    code: `package com.railway.exception;

public class SeatUnavailableException extends RailwayException {
    public SeatUnavailableException(String message) {
        super(message);
    }
}`
  },
  {
    id: 'InvalidPNRException',
    pkg: 'exception',
    fileName: 'InvalidPNRException.java',
    filePath: 'src/com/railway/exception/InvalidPNRException.java',
    summary: 'Thrown when PNR is missing or unknown.',
    code: `package com.railway.exception;

public class InvalidPNRException extends RailwayException {
    public InvalidPNRException(String message) {
        super(message);
    }
}`
  },
  {
    id: 'InvalidInputException',
    pkg: 'exception',
    fileName: 'InvalidInputException.java',
    filePath: 'src/com/railway/exception/InvalidInputException.java',
    summary: 'Thrown on invalid passenger, class, or booking parameters.',
    code: `package com.railway.exception;

public class InvalidInputException extends RailwayException {
    public InvalidInputException(String message) {
        super(message);
    }
}`
  },
  {
    id: 'TrainNotFoundException',
    pkg: 'exception',
    fileName: 'TrainNotFoundException.java',
    filePath: 'src/com/railway/exception/TrainNotFoundException.java',
    summary: 'Thrown when a train ID is not found.',
    code: `package com.railway.exception;

public class TrainNotFoundException extends RailwayException {
    public TrainNotFoundException(String message) {
        super(message);
    }
}`
  },
  {
    id: 'InvalidCancellationException',
    pkg: 'exception',
    fileName: 'InvalidCancellationException.java',
    filePath: 'src/com/railway/exception/InvalidCancellationException.java',
    summary: 'Thrown on duplicate or mismatched cancellations.',
    code: `package com.railway.exception;

public class InvalidCancellationException extends RailwayException {
    public InvalidCancellationException(String message) {
        super(message);
    }
}`
  },
  {
    id: 'IdGenerator',
    pkg: 'util',
    fileName: 'IdGenerator.java',
    filePath: 'src/com/railway/util/IdGenerator.java',
    summary: 'AtomicLong-based lock-free PNR and Ticket ID generator.',
    code: `package com.railway.util;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Lock-free thread-safe generator for unique PNR and Ticket IDs.
 */
public class IdGenerator {
    private final AtomicLong pnrSequence = new AtomicLong(100000L);
    private final AtomicLong ticketSequence = new AtomicLong(500000L);

    public String nextPnr() {
        return "PNR" + pnrSequence.incrementAndGet();
    }

    public String nextTicketId() {
        return "TKT" + ticketSequence.incrementAndGet();
    }
}`
  },
  {
    id: 'ValidationUtil',
    pkg: 'util',
    fileName: 'ValidationUtil.java',
    filePath: 'src/com/railway/util/ValidationUtil.java',
    summary: 'Input validator for age, passenger count, and strings.',
    code: `package com.railway.util;

import com.railway.exception.InvalidInputException;
import com.railway.model.Passenger;

import java.util.List;

/**
 * Central input validation utility.
 */
public final class ValidationUtil {
    public static final int MAX_PASSENGERS_PER_BOOKING = 6;
    public static final int MIN_AGE = 1;
    public static final int MAX_AGE = 120;

    private ValidationUtil() {
    }

    public static void validateNonBlank(String value, String fieldName) throws InvalidInputException {
        if (value == null || value.isBlank()) {
            throw new InvalidInputException(fieldName + " cannot be blank.");
        }
    }

    public static void validatePassengers(List<Passenger> passengers) throws InvalidInputException {
        if (passengers == null || passengers.isEmpty()) {
            throw new InvalidInputException("At least 1 passenger is required for booking.");
        }
        if (passengers.size() > MAX_PASSENGERS_PER_BOOKING) {
            throw new InvalidInputException(
                    "Maximum " + MAX_PASSENGERS_PER_BOOKING + " passengers allowed per booking.");
        }
        for (int i = 0; i < passengers.size(); i++) {
            Passenger p = passengers.get(i);
            if (p == null) {
                throw new InvalidInputException("Passenger #" + (i + 1) + " cannot be null.");
            }
            validateNonBlank(p.getName(), "Passenger #" + (i + 1) + " name");
            if (p.getAge() < MIN_AGE || p.getAge() > MAX_AGE) {
                throw new InvalidInputException(
                        "Invalid age " + p.getAge() + " for " + p.getName()
                                + ". Age must be between " + MIN_AGE + " and " + MAX_AGE + ".");
            }
            if (p.getGender() == null) {
                throw new InvalidInputException("Gender is required for " + p.getName() + ".");
            }
        }
    }
}`
  },
  {
    id: 'SeatAllocationStrategy',
    pkg: 'service',
    fileName: 'SeatAllocationStrategy.java',
    filePath: 'src/com/railway/service/SeatAllocationStrategy.java',
    summary: 'Strategy interface for berth/seat selection.',
    code: `package com.railway.service;

import com.railway.model.Passenger;
import com.railway.model.Seat;
import com.railway.model.TrainClass;

/**
 * Strategy interface for seat/berth allocation policies.
 */
public interface SeatAllocationStrategy {
    /**
     * Selects an unbooked seat from the given TrainClass for the passenger.
     * Must be invoked while holding TrainClass.getLock().
     */
    Seat selectSeat(TrainClass trainClass, Passenger passenger, boolean travelingAlone);
}`
  },
  {
    id: 'PriorityBerthAllocationStrategy',
    pkg: 'service',
    fileName: 'PriorityBerthAllocationStrategy.java',
    filePath: 'src/com/railway/service/PriorityBerthAllocationStrategy.java',
    summary: 'Lower-berth priority for seniors (60+) and solo women.',
    code: `package com.railway.service;

import com.railway.model.BerthType;
import com.railway.model.Gender;
import com.railway.model.Passenger;
import com.railway.model.Seat;
import com.railway.model.TrainClass;

/**
 * Allocates seats honoring berth preference when possible, and prioritizes LOWER berths
 * for senior citizens (age 60+) and women traveling alone.
 */
public class PriorityBerthAllocationStrategy implements SeatAllocationStrategy {

    @Override
    public Seat selectSeat(TrainClass trainClass, Passenger passenger, boolean travelingAlone) {
        boolean isPriorityLower = passenger.isSenior()
                || (passenger.getGender() == Gender.FEMALE && travelingAlone);

        BerthType preference = passenger.getBerthPreference();

        if (isPriorityLower) {
            if (preference == null || preference == BerthType.LOWER) {
                Seat lower = findFirstFreeByBerth(trainClass, BerthType.LOWER);
                if (lower != null) {
                    return lower;
                }
            } else {
                Seat preferred = findFirstFreeByBerth(trainClass, preference);
                if (preferred != null) {
                    return preferred;
                }
                Seat lower = findFirstFreeByBerth(trainClass, BerthType.LOWER);
                if (lower != null) {
                    return lower;
                }
            }
        } else if (preference != null) {
            Seat preferred = findFirstFreeByBerth(trainClass, preference);
            if (preferred != null) {
                return preferred;
            }
        } else {
            // Non-priority passenger with no preference: conserve LOWER berths
            for (Seat seat : trainClass.getSeats()) {
                if (!seat.isBooked() && seat.getBerthType() != BerthType.LOWER) {
                    return seat;
                }
            }
        }

        for (Seat seat : trainClass.getSeats()) {
            if (!seat.isBooked()) {
                return seat;
            }
        }
        return null;
    }

    private Seat findFirstFreeByBerth(TrainClass trainClass, BerthType berthType) {
        for (Seat seat : trainClass.getSeats()) {
            if (!seat.isBooked() && seat.getBerthType() == berthType) {
                return seat;
            }
        }
        return null;
    }
}`
  },
  {
    id: 'RefundPolicy',
    pkg: 'service',
    fileName: 'RefundPolicy.java',
    filePath: 'src/com/railway/service/RefundPolicy.java',
    summary: 'Strategy interface for refund calculation.',
    code: `package com.railway.service;

import com.railway.model.Ticket;
import com.railway.model.Train;

import java.time.LocalDateTime;

/**
 * Strategy interface for computing cancellation refunds.
 */
public interface RefundPolicy {
    double calculateRefund(Ticket ticket, Train train, LocalDateTime cancellationTime);
}`
  },
  {
    id: 'StandardRefundPolicy',
    pkg: 'service',
    fileName: 'StandardRefundPolicy.java',
    filePath: 'src/com/railway/service/StandardRefundPolicy.java',
    summary: 'Time-tiered refund percentages and WL clearing fee.',
    code: `package com.railway.service;

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
}`
  },
  {
    id: 'RefundCalculator',
    pkg: 'service',
    fileName: 'RefundCalculator.java',
    filePath: 'src/com/railway/service/RefundCalculator.java',
    summary: 'Context wrapper delegating to active RefundPolicy.',
    code: `package com.railway.service;

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
}`
  },
  {
    id: 'WaitingListManager',
    pkg: 'service',
    fileName: 'WaitingListManager.java',
    filePath: 'src/com/railway/service/WaitingListManager.java',
    summary: 'FIFO RAC and Waiting List queues with dynamic position re-indexing.',
    code: `package com.railway.service;

import com.railway.model.Ticket;
import com.railway.model.TicketStatus;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

/**
 * Manages FIFO RAC and Waiting List queues for a single TrainClass.
 * All methods must be invoked while holding the owning TrainClass lock.
 */
public class WaitingListManager {
    private final int racLimit;
    private final int wlLimit;
    private final LinkedList<Ticket> racQueue = new LinkedList<>();
    private final LinkedList<Ticket> waitingQueue = new LinkedList<>();

    public WaitingListManager(int racLimit, int wlLimit) {
        this.racLimit = racLimit;
        this.wlLimit = wlLimit;
    }

    public int getAvailableRacSlots() {
        return Math.max(0, racLimit - racQueue.size());
    }

    public int getAvailableWaitingSlots() {
        return Math.max(0, wlLimit - waitingQueue.size());
    }

    public boolean canAcceptRac() {
        return racQueue.size() < racLimit;
    }

    public boolean canAcceptWaiting() {
        return waitingQueue.size() < wlLimit;
    }

    public void enqueueRac(Ticket ticket) {
        if (!canAcceptRac()) {
            throw new IllegalStateException("RAC queue is full.");
        }
        ticket.setStatus(TicketStatus.RAC);
        ticket.setSeat(null);
        racQueue.addLast(ticket);
        ticket.setQueuePosition(racQueue.size());
    }

    public void enqueueWaiting(Ticket ticket) {
        if (!canAcceptWaiting()) {
            throw new IllegalStateException("Waiting list is full.");
        }
        ticket.setStatus(TicketStatus.WAITING);
        ticket.setSeat(null);
        waitingQueue.addLast(ticket);
        ticket.setQueuePosition(waitingQueue.size());
    }

    public Ticket pollNextRac() {
        Ticket next = racQueue.pollFirst();
        if (next != null) {
            next.setQueuePosition(0);
            renumberRacPositions();
        }
        return next;
    }

    public Ticket pollNextWaiting() {
        Ticket next = waitingQueue.pollFirst();
        if (next != null) {
            next.setQueuePosition(0);
            renumberWaitingPositions();
        }
        return next;
    }

    public boolean removeRac(Ticket ticket) {
        boolean removed = racQueue.remove(ticket);
        if (removed) {
            ticket.setQueuePosition(0);
            renumberRacPositions();
        }
        return removed;
    }

    public boolean removeWaiting(Ticket ticket) {
        boolean removed = waitingQueue.remove(ticket);
        if (removed) {
            ticket.setQueuePosition(0);
            renumberWaitingPositions();
        }
        return removed;
    }

    public int getRacCount() {
        return racQueue.size();
    }

    public int getWaitingCount() {
        return waitingQueue.size();
    }

    public List<Ticket> getRacSnapshot() {
        return new ArrayList<>(racQueue);
    }

    public List<Ticket> getWaitingSnapshot() {
        return new ArrayList<>(waitingQueue);
    }

    private void renumberRacPositions() {
        int pos = 1;
        for (Ticket t : racQueue) {
            t.setQueuePosition(pos++);
        }
    }

    private void renumberWaitingPositions() {
        int pos = 1;
        for (Ticket t : waitingQueue) {
            t.setQueuePosition(pos++);
        }
    }
}`
  },
  {
    id: 'TrainRepository',
    pkg: 'service',
    fileName: 'TrainRepository.java',
    filePath: 'src/com/railway/service/TrainRepository.java',
    summary: 'ConcurrentHashMap store for scheduled trains.',
    code: `package com.railway.service;

import com.railway.exception.TrainNotFoundException;
import com.railway.model.Train;

import java.util.Collection;
import java.util.Collections;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe in-memory store for trains.
 */
public class TrainRepository {
    private final ConcurrentHashMap<String, Train> trains = new ConcurrentHashMap<>();

    public void save(Train train) {
        trains.put(train.getTrainId().toUpperCase(), train);
    }

    public Train findById(String trainId) throws TrainNotFoundException {
        if (trainId == null || trainId.isBlank()) {
            throw new TrainNotFoundException("Train ID cannot be blank.");
        }
        Train train = trains.get(trainId.trim().toUpperCase());
        if (train == null) {
            throw new TrainNotFoundException("Train not found with ID: " + trainId);
        }
        return train;
    }

    public Collection<Train> findAll() {
        return Collections.unmodifiableCollection(trains.values());
    }
}`
  },
  {
    id: 'BookingRepository',
    pkg: 'service',
    fileName: 'BookingRepository.java',
    filePath: 'src/com/railway/service/BookingRepository.java',
    summary: 'ConcurrentHashMap + CopyOnWriteArrayList store for PNRs and user history.',
    code: `package com.railway.service;

import com.railway.exception.InvalidPNRException;
import com.railway.model.Booking;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Thread-safe in-memory store for bookings indexed by PNR and User ID.
 */
public class BookingRepository {
    private final ConcurrentHashMap<String, Booking> bookingsByPnr = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, CopyOnWriteArrayList<Booking>> bookingsByUser = new ConcurrentHashMap<>();

    public void save(Booking booking) {
        bookingsByPnr.put(booking.getPnr().toUpperCase(), booking);
        bookingsByUser
                .computeIfAbsent(booking.getUserId().toLowerCase(), k -> new CopyOnWriteArrayList<>())
                .add(booking);
    }

    public Booking findByPnr(String pnr) throws InvalidPNRException {
        if (pnr == null || pnr.isBlank()) {
            throw new InvalidPNRException("PNR cannot be blank.");
        }
        Booking booking = bookingsByPnr.get(pnr.trim().toUpperCase());
        if (booking == null) {
            throw new InvalidPNRException("No booking found for PNR: " + pnr);
        }
        return booking;
    }

    public List<Booking> findByUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            return Collections.emptyList();
        }
        CopyOnWriteArrayList<Booking> list = bookingsByUser.get(userId.trim().toLowerCase());
        return list == null ? Collections.emptyList() : new ArrayList<>(list);
    }

    public Collection<Booking> findAll() {
        return Collections.unmodifiableCollection(bookingsByPnr.values());
    }
}`
  },
  {
    id: 'BookingService',
    pkg: 'service',
    fileName: 'BookingService.java',
    filePath: 'src/com/railway/service/BookingService.java',
    summary: 'Atomic booking, availability, PNR lookup, chart generation, and history.',
    code: `package com.railway.service;

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

                sb.append("  Confirmed Seats:\\n");
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
                    sb.append("    (None)\\n");
                }

                List<Ticket> racList = tc.getWaitingListManager().getRacSnapshot();
                sb.append("  RAC Queue:\\n");
                if (racList.isEmpty()) {
                    sb.append("    (None)\\n");
                } else {
                    for (Ticket t : racList) {
                        sb.append(String.format("    RAC-%-3d -> %s | %s | %s%n",
                                t.getQueuePosition(), t.getPnr(), t.getTicketId(), t.getPassenger()));
                    }
                }

                List<Ticket> wlList = tc.getWaitingListManager().getWaitingSnapshot();
                sb.append("  Waiting List:\\n");
                if (wlList.isEmpty()) {
                    sb.append("    (None)\\n");
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
}`
  },
  {
    id: 'CancellationService',
    pkg: 'service',
    fileName: 'CancellationService.java',
    filePath: 'src/com/railway/service/CancellationService.java',
    summary: 'Full & partial PNR cancellation with atomic FIFO promotions and refunds.',
    code: `package com.railway.service;

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
}`
  },
  {
    id: 'ConcurrencyStressTest',
    pkg: 'service',
    fileName: 'ConcurrencyStressTest.java',
    filePath: 'src/com/railway/service/ConcurrencyStressTest.java',
    summary: '60-thread last-5-seats race and mixed concurrent booking/cancellation invariants.',
    code: `package com.railway.service;

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
        report.append("=== CONCURRENCY STRESS TEST SUITE ===\\n");
        report.append(runLastFiveSeatsRaceTest()).append("\\n");
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
        sb.append("[Test 1] 60 Threads Racing for Last 5 Seats:\\n");
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
                    "[Test 2] Concurrent Bookings (%d ok) + Cancellations (%d ok):\\n"
                            + "  Confirmed: %d/%d | Occupied Seats: %d | Duplicate Seats: %s\\n"
                            + "  RAC: %d/%d (FIFO valid: %s) | Waiting: %d/%d (FIFO valid: %s) | Cancelled: %d\\n"
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
}`
  },
  {
    id: 'Main',
    pkg: 'root',
    fileName: 'Main.java',
    filePath: 'src/com/railway/Main.java',
    summary: 'Menu-driven console application with 4 pre-loaded sample trains.',
    code: `package com.railway;

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
                    case "7" -> System.out.println("\\n" + stressTest.runAllTests());
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
        System.out.println("\\n================ RAILWAY RESERVATION SYSTEM ================");
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
            System.out.println("\\nBooking Successful!");
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
            System.out.println("\\n" + chart);
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
            System.out.println("\\n=== BOOKING HISTORY ===");
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
}`
  }
];
