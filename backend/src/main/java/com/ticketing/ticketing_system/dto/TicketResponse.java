package com.ticketing.ticketing_system.dto;

import com.ticketing.ticketing_system.model.*;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class TicketResponse {

    private Long id;
    private String title;
    private String description;
    private TicketStatus status;
    private TicketPriority priority;
    private String category;
    private UserSummary createdBy;
    private UserSummary assignedTo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;

    /**
     * Nested record for a lightweight user projection embedded in ticket responses.
     * Using a record keeps it immutable and concise without extra Lombok annotations.
     */
    public record UserSummary(Long id, String name, String email, Role role) {
        public static UserSummary from(User user) {
            if (user == null) return null;
            return new UserSummary(user.getId(), user.getName(), user.getEmail(), user.getRole());
        }
    }

    public static TicketResponse from(Ticket ticket) {
        return TicketResponse.builder()
                .id(ticket.getId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .category(ticket.getCategory())
                .createdBy(UserSummary.from(ticket.getCreatedBy()))
                .assignedTo(UserSummary.from(ticket.getAssignedTo()))
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .resolvedAt(ticket.getResolvedAt())
                .build();
    }
}