package com.railway.exception;

/**
 * Base checked exception for all domain errors in the railway reservation system.
 */
public class RailwayException extends Exception {
    public RailwayException(String message) {
        super(message);
    }
}
