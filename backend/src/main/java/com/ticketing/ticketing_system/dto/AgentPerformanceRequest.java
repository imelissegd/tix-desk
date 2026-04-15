package com.ticketing.ticketing_system.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AgentPerformanceRequest {

    private Long agentId;
    private String name;
    private String email;
    private long totalAssigned;
    private long totalResolved;
    private long openCount;
    private double avgResolutionHours;
    private int currentWorkload;
}