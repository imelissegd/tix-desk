package com.ticketing.ticketing_system.service;

import com.ticketing.ticketing_system.dto.AgentPerformanceRequest;
import com.ticketing.ticketing_system.dto.DailyVolume;
import com.ticketing.ticketing_system.dto.DashboardSummary;
import com.ticketing.ticketing_system.model.Role;
import com.ticketing.ticketing_system.model.Ticket;
import com.ticketing.ticketing_system.model.TicketStatus;
import com.ticketing.ticketing_system.model.User;
import com.ticketing.ticketing_system.repository.TicketRepository;
import com.ticketing.ticketing_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
@Transactional(readOnly = true)
public class MetricsService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final WorkloadService workloadService;

    // ── status counts ─────────────────────────────────────────────────────────

    public Map<TicketStatus, Long> getTicketCountsByStatus() {
        // Ensure all statuses are present in the map even if count is 0
        return Arrays.stream(TicketStatus.values())
                .collect(Collectors.toMap(
                        status -> status,
                        ticketRepository::countByStatus
                ));
    }

    // ── avg resolution time ───────────────────────────────────────────────────

    public double getAverageResolutionTimeHours() {
        List<Ticket> resolved = ticketRepository.findByResolvedAtIsNotNull();

        if (resolved.isEmpty()) return 0.0;

        return resolved.stream()
                .mapToLong(t -> Duration.between(t.getCreatedAt(), t.getResolvedAt()).toMinutes())
                .average()
                .orElse(0.0) / 60.0;
    }

    // ── agent performance ─────────────────────────────────────────────────────

    public List<AgentPerformanceRequest> getAgentPerformanceReport() {
        List<User> agents = userRepository.findByRole(Role.AGENT);

        return agents.stream().map(agent -> {
            List<Ticket> assigned = ticketRepository.findByAssignedTo_Id(agent.getId());

            long totalResolved = assigned.stream()
                    .filter(t -> t.getStatus() == TicketStatus.RESOLVED
                              || t.getStatus() == TicketStatus.CLOSED)
                    .count();

            long openCount = assigned.stream()
                    .filter(t -> t.getStatus() == TicketStatus.OPEN
                              || t.getStatus() == TicketStatus.IN_PROGRESS)
                    .count();

            double avgResolutionHours = assigned.stream()
                    .filter(t -> t.getResolvedAt() != null)
                    .mapToLong(t -> Duration.between(t.getCreatedAt(), t.getResolvedAt()).toMinutes())
                    .average()
                    .orElse(0.0) / 60.0;

            int currentWorkload = workloadService.getAgentWorkload(agent);

            return AgentPerformanceRequest.builder()
                    .agentId(agent.getId())
                    .name(agent.getName())
                    .email(agent.getEmail())
                    .totalAssigned(assigned.size())
                    .totalResolved(totalResolved)
                    .openCount(openCount)
                    .avgResolutionHours(avgResolutionHours)
                    .currentWorkload(currentWorkload)
                    .build();
        }).toList();
    }

    // ── daily volume ──────────────────────────────────────────────────────────

    public List<DailyVolume> getTicketVolumeByDay(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end   = to.plusDays(1).atStartOfDay(); // exclusive upper bound

        List<Ticket> tickets = ticketRepository.findByCreatedAtBetween(start, end);

        // Group by date, count per day, fill in zero-count days in the range
        Map<LocalDate, Long> countsByDay = tickets.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getCreatedAt().toLocalDate(),
                        Collectors.counting()
                ));

        return from.datesUntil(to.plusDays(1))
                .map(date -> DailyVolume.builder()
                        .date(date)
                        .count(countsByDay.getOrDefault(date, 0L))
                        .build())
                .toList();
    }

    // ── dashboard summary ─────────────────────────────────────────────────────

    public DashboardSummary getDashboardSummary() {
        Map<TicketStatus, Long> byStatus = getTicketCountsByStatus();

        long totalTickets = byStatus.values().stream().mapToLong(Long::longValue).sum();
        int totalAgents   = userRepository.findByRole(Role.AGENT).size();

        return DashboardSummary.builder()
                .ticketsByStatus(byStatus)
                .avgResolutionHours(getAverageResolutionTimeHours())
                .totalAgents(totalAgents)
                .totalTickets(totalTickets)
                .build();
    }
}