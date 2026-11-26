package com.railway.service;

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
}
