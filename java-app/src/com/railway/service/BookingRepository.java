package com.railway.service;

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
}
