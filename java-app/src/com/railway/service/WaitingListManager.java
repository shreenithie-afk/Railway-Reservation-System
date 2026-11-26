package com.railway.service;

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
}
