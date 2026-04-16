package com.ticketing.ticketing_system.dto;

import java.util.Map;

import com.ticketing.ticketing_system.model.Role;
import com.ticketing.ticketing_system.model.TicketStatus;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DashboardSummary {

    private Map<TicketStatus, Long> ticketsByStatus;
    private double avgResolutionHours;
    private long totalTickets;
    private long totalUsers;
    private Map<Role, Long> usersByRole;
}