package com.railway.util;

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
}
