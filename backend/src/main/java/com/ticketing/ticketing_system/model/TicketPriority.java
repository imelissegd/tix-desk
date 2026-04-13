package com.ticketing.ticketing_system.model;

public enum TicketPriority {
    LOW(1),
    MEDIUM(2),
    HIGH(3),
    CRITICAL(4);

    private final int weight;

    TicketPriority(int weight) {
        this.weight = weight;
    }

    public int getWeight() {
        return weight;
    }
}