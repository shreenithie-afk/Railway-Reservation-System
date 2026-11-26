package com.railway.model;

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
}
