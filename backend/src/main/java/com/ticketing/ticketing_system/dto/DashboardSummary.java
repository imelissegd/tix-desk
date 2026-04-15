package com.ticketing.ticketing_system.dto;

import com.ticketing.ticketing_system.model.TicketStatus;
import lombok.Builder;
import lombok.Getter;

import java.util.Map;

@Getter
@Builder
public class DashboardSummary {

    private Map<TicketStatus, Long> ticketsByStatus;
    private double avgResolutionHours;
    private int totalAgents;
    private long totalTickets;
}