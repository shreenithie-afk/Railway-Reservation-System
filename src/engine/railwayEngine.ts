export type ClassCode = 'SL' | '3A' | '2A' | '1A';
export type BerthType = 'LOWER' | 'MIDDLE' | 'UPPER' | 'SIDE';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type TicketStatus = 'CONFIRMED' | 'RAC' | 'WAITING' | 'CANCELLED';

export interface PassengerInput {
  name: string;
  age: number;
  gender: Gender;
  berthPreference: BerthType | null;
}

export interface Seat {
  seatNumber: number;
  coach: string;
  berthType: BerthType;
  booked: boolean;
  assignedTicketId: string | null;
}

export interface Ticket {
  ticketId: string;
  pnr: string;
  trainId: string;
  classCode: ClassCode;
  passenger: PassengerInput;
  fare: number;
  status: TicketStatus;
  seatLabel: string | null;
  seatNumber: number | null;
  queuePosition: number;
  refundAmount: number;
  cancelledAt: string | null;
}

export interface Booking {
  pnr: string;
  userId: string;
  trainId: string;
  trainName: string;
  classCode: ClassCode;
  bookedAt: string;
  tickets: Ticket[];
  totalFare: number;
}

export interface TrainClass {
  classCode: ClassCode;
  displayName: string;
  coachPrefix: string;
  seatCapacity: number;
  fare: number;
  racLimit: number;
  wlLimit: number;
  seats: Seat[];
  racQueue: Ticket[];
  waitingQueue: Ticket[];
}

export interface Train {
  trainId: string;
  name: string;
  source: string;
  destination: string;
  departureTime: Date;
  classes: Partial<Record<ClassCode, TrainClass>>;
}

export interface AvailabilitySummary {
  trainId: string;
  trainName: string;
  classCode: ClassCode;
  displayName: string;
  fare: number;
  seatCapacity: number;
  availableConfirmed: number;
  racLimit: number;
  availableRac: number;
  occupiedRac: number;
  wlLimit: number;
  availableWaiting: number;
  occupiedWaiting: number;
  departed: boolean;
}

export interface CancellationSummary {
  pnr: string;
  cancelledTickets: Ticket[];
  promotionLogs: string[];
  totalRefund: number;
}

export interface StressTestReport {
  raceConfirmed: number;
  raceUniqueSeats: number;
  raceRejected: number;
  raceAssignments: Array<{ worker: string; pnr: string; ticketId: string; seatLabel: string }>;
  racePassed: boolean;
  mixedBookingsOk: number;
  mixedCancelsOk: number;
  mixedConfirmed: number;
  mixedCapacity: number;
  mixedDuplicateSeats: boolean;
  mixedRacCount: number;
  mixedRacLimit: number;
  mixedRacFifoValid: boolean;
  mixedWlCount: number;
  mixedWlLimit: number;
  mixedWlFifoValid: boolean;
  mixedCancelledCount: number;
  mixedInvariantsPassed: boolean;
}

const CLASS_META: Record<ClassCode, { displayName: string; coachPrefix: string; seatsPerCoach: number }> = {
  SL: { displayName: 'Sleeper', coachPrefix: 'S', seatsPerCoach: 72 },
  '3A': { displayName: 'AC 3 Tier', coachPrefix: 'B', seatsPerCoach: 72 },
  '2A': { displayName: 'AC 2 Tier', coachPrefix: 'A', seatsPerCoach: 48 },
  '1A': { displayName: 'First AC', coachPrefix: 'H', seatsPerCoach: 24 }
};

function createSeats(classCode: ClassCode, capacity: number): Seat[] {
  const meta = CLASS_META[classCode];
  const pattern: BerthType[] =
    classCode === 'SL' || classCode === '3A'
      ? ['LOWER', 'MIDDLE', 'UPPER', 'LOWER', 'MIDDLE', 'UPPER', 'SIDE', 'SIDE']
      : classCode === '2A'
        ? ['LOWER', 'UPPER', 'LOWER', 'UPPER', 'SIDE', 'SIDE']
        : ['LOWER', 'UPPER'];

  const seats: Seat[] = [];
  for (let i = 0; i < capacity; i++) {
    const seatNumber = i + 1;
    const coach = `${meta.coachPrefix}${Math.floor(i / meta.seatsPerCoach) + 1}`;
    const berthType = pattern[i % pattern.length];
    seats.push({
      seatNumber,
      coach,
      berthType,
      booked: false,
      assignedTicketId: null
    });
  }
  return seats;
}

function createTrainClass(
  classCode: ClassCode,
  seatCapacity: number,
  fare: number,
  racLimit: number,
  wlLimit: number
): TrainClass {
  const meta = CLASS_META[classCode];
  return {
    classCode,
    displayName: meta.displayName,
    coachPrefix: meta.coachPrefix,
    seatCapacity,
    fare,
    racLimit,
    wlLimit,
    seats: createSeats(classCode, seatCapacity),
    racQueue: [],
    waitingQueue: []
  };
}

export class RailwayEngine {
  private trains = new Map<string, Train>();
  private bookingsByPnr = new Map<string, Booking>();
  private pnrCounter = 100000;
  private ticketCounter = 500000;

  constructor(seedSampleData = true) {
    if (seedSampleData) {
      this.loadSampleTrains();
      this.seedInitialBookings();
    }
  }

  private nextPnr(): string {
    this.pnrCounter += 1;
    return `PNR${this.pnrCounter}`;
  }

  private nextTicketId(): string {
    this.ticketCounter += 1;
    return `TKT${this.ticketCounter}`;
  }

  public addTrain(train: Train): void {
    this.trains.set(train.trainId.toUpperCase(), train);
  }

  private loadSampleTrains(): void {
    const now = Date.now();
    const hour = 3600 * 1000;
    const day = 24 * hour;

    this.addTrain({
      trainId: '12951',
      name: 'Mumbai Rajdhani Express',
      source: 'Mumbai Central',
      destination: 'New Delhi',
      departureTime: new Date(now + 3 * day),
      classes: {
        SL: createTrainClass('SL', 8, 480, 2, 3),
        '3A': createTrainClass('3A', 8, 1350, 2, 2),
        '2A': createTrainClass('2A', 6, 1980, 1, 2),
        '1A': createTrainClass('1A', 4, 3250, 0, 2)
      }
    });

    this.addTrain({
      trainId: '12002',
      name: 'Bhopal Shatabdi Express',
      source: 'New Delhi',
      destination: 'Rani Kamalapati',
      departureTime: new Date(now + 24 * hour),
      classes: {
        SL: createTrainClass('SL', 8, 420, 2, 4),
        '3A': createTrainClass('3A', 6, 1150, 2, 3),
        '2A': createTrainClass('2A', 4, 1750, 1, 2)
      }
    });

    this.addTrain({
      trainId: '12627',
      name: 'Karnataka Express',
      source: 'Bengaluru',
      destination: 'New Delhi',
      departureTime: new Date(now + 6 * hour),
      classes: {
        SL: createTrainClass('SL', 6, 360, 2, 3),
        '3A': createTrainClass('3A', 4, 980, 1, 2)
      }
    });

    this.addTrain({
      trainId: '12124',
      name: 'Deccan Queen (Departed)',
      source: 'Pune',
      destination: 'Mumbai CSMT',
      departureTime: new Date(now - 2 * hour),
      classes: {
        SL: createTrainClass('SL', 4, 300, 1, 1)
      }
    });
  }

  private seedInitialBookings(): void {
    try {
      this.bookTickets('alice', '12951', '3A', [
        { name: 'Meera Nair', age: 66, gender: 'FEMALE', berthPreference: 'LOWER' },
        { name: 'Rahul Nair', age: 34, gender: 'MALE', berthPreference: 'UPPER' }
      ]);
      this.bookTickets('bob', '12002', 'SL', [
        { name: 'Ananya Rao', age: 29, gender: 'FEMALE', berthPreference: null }
      ]);
    } catch {
      // ignore seed errors
    }
  }

  public getAllTrains(): Train[] {
    return Array.from(this.trains.values());
  }

  public getTrain(trainId: string): Train {
    const train = this.trains.get(trainId.trim().toUpperCase());
    if (!train) {
      throw new Error(`Train '${trainId}' not found.`);
    }
    return train;
  }

  public getTrainClass(trainId: string, classCode: ClassCode): TrainClass {
    const train = this.getTrain(trainId);
    const tc = train.classes[classCode];
    if (!tc) {
      throw new Error(`Class ${classCode} is not available on train ${train.trainId}.`);
    }
    return tc;
  }

  public getAvailability(trainId: string, classCode: ClassCode): AvailabilitySummary {
    const train = this.getTrain(trainId);
    const tc = this.getTrainClass(trainId, classCode);
    const availableConfirmed = tc.seats.filter((s) => !s.booked).length;
    const occupiedRac = tc.racQueue.length;
    const occupiedWaiting = tc.waitingQueue.length;
    return {
      trainId: train.trainId,
      trainName: train.name,
      classCode,
      displayName: tc.displayName,
      fare: tc.fare,
      seatCapacity: tc.seatCapacity,
      availableConfirmed,
      racLimit: tc.racLimit,
      availableRac: Math.max(0, tc.racLimit - occupiedRac),
      occupiedRac,
      wlLimit: tc.wlLimit,
      availableWaiting: Math.max(0, tc.wlLimit - occupiedWaiting),
      occupiedWaiting,
      departed: Date.now() >= train.departureTime.getTime()
    };
  }

  public bookTickets(
    userId: string,
    trainId: string,
    classCode: ClassCode,
    passengers: PassengerInput[],
    bookingTime: Date = new Date()
  ): Booking {
    const cleanUser = userId.trim();
    if (!cleanUser) {
      throw new Error('User ID cannot be blank.');
    }
    if (!passengers.length) {
      throw new Error('At least 1 passenger is required.');
    }
    if (passengers.length > 6) {
      throw new Error('Maximum 6 passengers are allowed per booking.');
    }

    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name.trim()) {
        throw new Error(`Passenger #${i + 1} name cannot be blank.`);
      }
      if (!Number.isInteger(p.age) || p.age < 1 || p.age > 120) {
        throw new Error(`Invalid age (${p.age}) for ${p.name}. Age must be between 1 and 120.`);
      }
    }

    const train = this.getTrain(trainId);
    if (bookingTime.getTime() >= train.departureTime.getTime()) {
      throw new Error(`Booking closed: train ${train.trainId} has already departed.`);
    }

    const tc = this.getTrainClass(trainId, classCode);
    const availConfirmed = tc.seats.filter((s) => !s.booked).length;
    const availRac = Math.max(0, tc.racLimit - tc.racQueue.length);
    const availWl = Math.max(0, tc.wlLimit - tc.waitingQueue.length);
    const totalRemaining = availConfirmed + availRac + availWl;

    if (passengers.length > totalRemaining) {
      throw new Error(
        `Requested ${passengers.length} ticket(s) in ${classCode}, but only ${totalRemaining} slots remain (Confirmed: ${availConfirmed}, RAC: ${availRac}, WL: ${availWl}).`
      );
    }

    const pnr = this.nextPnr();
    const singlePassenger = passengers.length === 1;
    const indices = passengers.map((_, i) => i);
    indices.sort((a, b) => {
      const pa = this.isPriorityLower(passengers[a], singlePassenger) ? 0 : 1;
      const pb = this.isPriorityLower(passengers[b], singlePassenger) ? 0 : 1;
      return pa - pb;
    });

    const tickets: Ticket[] = new Array(passengers.length);

    for (const idx of indices) {
      const passenger = { ...passengers[idx], name: passengers[idx].name.trim() };
      const ticketId = this.nextTicketId();
      const ticket: Ticket = {
        ticketId,
        pnr,
        trainId: train.trainId,
        classCode,
        passenger,
        fare: tc.fare,
        status: 'CONFIRMED',
        seatLabel: null,
        seatNumber: null,
        queuePosition: 0,
        refundAmount: 0,
        cancelledAt: null
      };

      const seat = this.selectSeat(tc, passenger, singlePassenger);
      if (seat) {
        seat.booked = true;
        seat.assignedTicketId = ticketId;
        ticket.status = 'CONFIRMED';
        ticket.seatNumber = seat.seatNumber;
        ticket.seatLabel = `${seat.coach}-${seat.seatNumber} (${seat.berthType})`;
      } else if (tc.racQueue.length < tc.racLimit) {
        ticket.status = 'RAC';
        tc.racQueue.push(ticket);
        ticket.queuePosition = tc.racQueue.length;
      } else if (tc.waitingQueue.length < tc.wlLimit) {
        ticket.status = 'WAITING';
        tc.waitingQueue.push(ticket);
        ticket.queuePosition = tc.waitingQueue.length;
      } else {
        throw new Error(`Waiting list is full for ${classCode}.`);
      }

      tickets[idx] = ticket;
    }

    const totalFare = Math.round(tc.fare * passengers.length * 100) / 100;
    const booking: Booking = {
      pnr,
      userId: cleanUser,
      trainId: train.trainId,
      trainName: train.name,
      classCode,
      bookedAt: bookingTime.toISOString(),
      tickets,
      totalFare
    };

    this.bookingsByPnr.set(pnr.toUpperCase(), booking);
    return booking;
  }

  private isPriorityLower(p: PassengerInput, travelingAlone: boolean): boolean {
    return p.age >= 60 || (p.gender === 'FEMALE' && travelingAlone);
  }

  private selectSeat(tc: TrainClass, passenger: PassengerInput, travelingAlone: boolean): Seat | null {
    const priorityLower = this.isPriorityLower(passenger, travelingAlone);
    const pref = passenger.berthPreference;

    const findByBerth = (berth: BerthType) =>
      tc.seats.find((s) => !s.booked && s.berthType === berth) ?? null;

    if (priorityLower) {
      if (!pref || pref === 'LOWER') {
        const lower = findByBerth('LOWER');
        if (lower) return lower;
      } else {
        const preferred = findByBerth(pref);
        if (preferred) return preferred;
        const lower = findByBerth('LOWER');
        if (lower) return lower;
      }
    } else if (pref) {
      const preferred = findByBerth(pref);
      if (preferred) return preferred;
    } else {
      const nonLower = tc.seats.find((s) => !s.booked && s.berthType !== 'LOWER');
      if (nonLower) return nonLower;
    }

    return tc.seats.find((s) => !s.booked) ?? null;
  }

  public getBookingByPnr(pnr: string): Booking {
    const clean = pnr.trim().toUpperCase();
    if (!clean) {
      throw new Error('PNR cannot be blank.');
    }
    const booking = this.bookingsByPnr.get(clean);
    if (!booking) {
      throw new Error(`No booking found for PNR '${pnr}'.`);
    }
    return booking;
  }

  public getAllBookings(): Booking[] {
    return Array.from(this.bookingsByPnr.values()).reverse();
  }

  public getUserBookings(userId: string): Booking[] {
    const clean = userId.trim().toLowerCase();
    if (!clean) return [];
    return this.getAllBookings().filter((b) => b.userId.toLowerCase() === clean);
  }

  public computeRefund(ticket: Ticket, train: Train, cancellationTime: Date): number {
    const minutesUntilDeparture =
      (train.departureTime.getTime() - cancellationTime.getTime()) / (60 * 1000);
    if (minutesUntilDeparture <= 0) {
      return 0;
    }
    if (ticket.status === 'WAITING') {
      return Math.round(Math.max(0, ticket.fare - 60) * 100) / 100;
    }
    const hours = minutesUntilDeparture / 60;
    const rate = hours > 48 ? 0.75 : hours >= 12 ? 0.5 : 0.25;
    return Math.round(ticket.fare * rate * 100) / 100;
  }

  public cancelFullPnr(pnr: string, cancellationTime: Date = new Date()): CancellationSummary {
    const booking = this.getBookingByPnr(pnr);
    const activeIds = booking.tickets
      .filter((t) => t.status !== 'CANCELLED')
      .map((t) => t.ticketId);
    if (activeIds.length === 0) {
      throw new Error(`All tickets under PNR ${booking.pnr} are already cancelled.`);
    }
    return this.cancelTickets(booking.pnr, activeIds, cancellationTime);
  }

  public cancelTickets(
    pnr: string,
    ticketIds: string[],
    cancellationTime: Date = new Date()
  ): CancellationSummary {
    if (!ticketIds.length) {
      throw new Error('Select at least one ticket to cancel.');
    }

    const booking = this.getBookingByPnr(pnr);
    const train = this.getTrain(booking.trainId);
    const tc = this.getTrainClass(booking.trainId, booking.classCode);

    const uniqueIds = Array.from(new Set(ticketIds.map((id) => id.trim().toUpperCase())));
    const targets: Ticket[] = [];

    for (const tid of uniqueIds) {
      const matched = booking.tickets.find((t) => t.ticketId.toUpperCase() === tid);
      if (!matched) {
        throw new Error(`Ticket ${tid} does not belong to PNR ${booking.pnr}.`);
      }
      if (matched.status === 'CANCELLED') {
        throw new Error(`Ticket ${matched.ticketId} is already cancelled.`);
      }
      targets.push(matched);
    }

    let totalRefund = 0;
    const promotionLogs: string[] = [];

    for (const ticket of targets) {
      const prevStatus = ticket.status;
      const refund = this.computeRefund(ticket, train, cancellationTime);
      ticket.refundAmount = refund;
      ticket.cancelledAt = cancellationTime.toISOString();
      totalRefund += refund;

      if (prevStatus === 'CONFIRMED') {
        const seatNo = ticket.seatNumber;
        ticket.seatNumber = null;
        ticket.seatLabel = null;
        ticket.status = 'CANCELLED';
        if (seatNo !== null) {
          const seat = tc.seats.find((s) => s.seatNumber === seatNo);
          if (seat) {
            seat.booked = false;
            seat.assignedTicketId = null;
          }
        }
        this.promoteAfterConfirmedCancellation(tc, promotionLogs);
      } else if (prevStatus === 'RAC') {
        const idx = tc.racQueue.indexOf(ticket);
        if (idx >= 0) tc.racQueue.splice(idx, 1);
        this.renumberQueue(tc.racQueue);
        ticket.queuePosition = 0;
        ticket.status = 'CANCELLED';
        this.promoteWaitingToRac(tc, promotionLogs);
      } else if (prevStatus === 'WAITING') {
        const idx = tc.waitingQueue.indexOf(ticket);
        if (idx >= 0) tc.waitingQueue.splice(idx, 1);
        this.renumberQueue(tc.waitingQueue);
        ticket.queuePosition = 0;
        ticket.status = 'CANCELLED';
      }
    }

    return {
      pnr: booking.pnr,
      cancelledTickets: targets,
      promotionLogs,
      totalRefund: Math.round(totalRefund * 100) / 100
    };
  }

  private promoteAfterConfirmedCancellation(tc: TrainClass, logs: string[]): void {
    const nextRac = tc.racQueue.shift();
    if (nextRac) {
      this.renumberQueue(tc.racQueue);
      nextRac.queuePosition = 0;
      const seat = this.selectSeat(tc, nextRac.passenger, true);
      if (seat) {
        seat.booked = true;
        seat.assignedTicketId = nextRac.ticketId;
        nextRac.seatNumber = seat.seatNumber;
        nextRac.seatLabel = `${seat.coach}-${seat.seatNumber} (${seat.berthType})`;
        nextRac.status = 'CONFIRMED';
        logs.push(
          `Promoted ${nextRac.ticketId} (${nextRac.pnr}) from RAC to CONFIRMED -> ${nextRac.seatLabel}`
        );
        this.promoteWaitingToRac(tc, logs);
      }
    } else if (tc.racLimit === 0 && tc.waitingQueue.length > 0) {
      const nextWl = tc.waitingQueue.shift()!;
      this.renumberQueue(tc.waitingQueue);
      nextWl.queuePosition = 0;
      const seat = this.selectSeat(tc, nextWl.passenger, true);
      if (seat) {
        seat.booked = true;
        seat.assignedTicketId = nextWl.ticketId;
        nextWl.seatNumber = seat.seatNumber;
        nextWl.seatLabel = `${seat.coach}-${seat.seatNumber} (${seat.berthType})`;
        nextWl.status = 'CONFIRMED';
        logs.push(
          `Promoted ${nextWl.ticketId} (${nextWl.pnr}) from WAITING directly to CONFIRMED -> ${nextWl.seatLabel}`
        );
      }
    }
  }

  private promoteWaitingToRac(tc: TrainClass, logs: string[]): void {
    if (tc.racQueue.length < tc.racLimit && tc.waitingQueue.length > 0) {
      const nextWl = tc.waitingQueue.shift()!;
      this.renumberQueue(tc.waitingQueue);
      nextWl.status = 'RAC';
      tc.racQueue.push(nextWl);
      nextWl.queuePosition = tc.racQueue.length;
      logs.push(
        `Promoted ${nextWl.ticketId} (${nextWl.pnr}) from WAITING to RAC-${nextWl.queuePosition}`
      );
    }
  }

  private renumberQueue(queue: Ticket[]): void {
    queue.forEach((t, idx) => {
      t.queuePosition = idx + 1;
    });
  }

  public getTicketsForTrainClass(trainId: string, classCode: ClassCode): Ticket[] {
    const result: Ticket[] = [];
    for (const b of this.bookingsByPnr.values()) {
      if (b.trainId === trainId && b.classCode === classCode) {
        result.push(...b.tickets);
      }
    }
    return result;
  }

  public runStressTestSimulation(): StressTestReport {
    const sim = new RailwayEngine(false);
    const future = new Date(Date.now() + 3 * 24 * 3600 * 1000);

    sim.addTrain({
      trainId: 'RACE-01',
      name: 'Concurrency Express',
      source: 'City A',
      destination: 'City B',
      departureTime: future,
      classes: { SL: createTrainClass('SL', 5, 450, 0, 0) }
    });

    const raceAssignments: StressTestReport['raceAssignments'] = [];
    let raceRejected = 0;

    for (let i = 1; i <= 60; i++) {
      try {
        const b = sim.bookTickets(`racer-${i}`, 'RACE-01', 'SL', [
          {
            name: `Racer-${i}`,
            age: 25 + (i % 45),
            gender: i % 2 === 0 ? 'FEMALE' : 'MALE',
            berthPreference: 'LOWER'
          }
        ]);
        const t = b.tickets[0];
        raceAssignments.push({
          worker: `Worker-${i}`,
          pnr: t.pnr,
          ticketId: t.ticketId,
          seatLabel: t.seatLabel ?? '-'
        });
      } catch {
        raceRejected += 1;
      }
    }

    const uniqueRaceSeats = new Set(raceAssignments.map((a) => a.seatLabel)).size;
    const racePassed =
      raceAssignments.length === 5 && uniqueRaceSeats === 5 && raceRejected === 55;

    // Phase 2: Mixed Bookings & Cancellations
    sim.addTrain({
      trainId: 'MIX-02',
      name: 'Invariant Shatabdi',
      source: 'Delhi',
      destination: 'Mumbai',
      departureTime: future,
      classes: { '3A': createTrainClass('3A', 12, 1200, 5, 15) }
    });

    const pnrPool: string[] = [];
    let mixedBookingsOk = 0;
    let mixedCancelsOk = 0;

    for (let step = 1; step <= 50; step++) {
      if (step <= 35) {
        try {
          const paxCount = 1 + (step % 2);
          const pax: PassengerInput[] = [];
          for (let k = 0; k < paxCount; k++) {
            pax.push({
              name: `Pax-${step}-${k}`,
              age: 30 + (step % 40),
              gender: k === 0 && step % 3 === 0 ? 'FEMALE' : 'MALE',
              berthPreference: 'LOWER'
            });
          }
          const b = sim.bookTickets(`u${step}`, 'MIX-02', '3A', pax);
          pnrPool.push(b.pnr);
          mixedBookingsOk += 1;
        } catch {
          // capacity reached
        }
      }
      if (step % 3 === 0 && pnrPool.length > 0) {
        const pnr = pnrPool.shift()!;
        try {
          const b = sim.getBookingByPnr(pnr);
          if (b.tickets.length > 1) {
            sim.cancelTickets(pnr, [b.tickets[0].ticketId]);
          } else {
            sim.cancelFullPnr(pnr);
          }
          mixedCancelsOk += 1;
        } catch {
          // ignore
        }
      }
    }

    const tc = sim.getTrainClass('MIX-02', '3A');
    const allTickets = sim.getTicketsForTrainClass('MIX-02', '3A');
    const confirmedTickets = allTickets.filter((t) => t.status === 'CONFIRMED');
    const seatSet = new Set(confirmedTickets.map((t) => t.seatNumber));
    const mixedDuplicateSeats = seatSet.size !== confirmedTickets.length;
    const mixedCancelledCount = allTickets.filter((t) => t.status === 'CANCELLED').length;
    const mixedRacFifoValid = tc.racQueue.every((t, idx) => t.queuePosition === idx + 1);
    const mixedWlFifoValid = tc.waitingQueue.every((t, idx) => t.queuePosition === idx + 1);

    const mixedInvariantsPassed =
      confirmedTickets.length <= tc.seatCapacity &&
      !mixedDuplicateSeats &&
      tc.racQueue.length <= tc.racLimit &&
      tc.waitingQueue.length <= tc.wlLimit &&
      mixedRacFifoValid &&
      mixedWlFifoValid;

    return {
      raceConfirmed: raceAssignments.length,
      raceUniqueSeats: uniqueRaceSeats,
      raceRejected,
      raceAssignments,
      racePassed,
      mixedBookingsOk,
      mixedCancelsOk,
      mixedConfirmed: confirmedTickets.length,
      mixedCapacity: tc.seatCapacity,
      mixedDuplicateSeats,
      mixedRacCount: tc.racQueue.length,
      mixedRacLimit: tc.racLimit,
      mixedRacFifoValid,
      mixedWlCount: tc.waitingQueue.length,
      mixedWlLimit: tc.wlLimit,
      mixedWlFifoValid,
      mixedCancelledCount,
      mixedInvariantsPassed
    };
  }
}
