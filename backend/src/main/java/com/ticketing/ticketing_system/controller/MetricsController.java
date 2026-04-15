package com.ticketing.ticketing_system.controller;

import com.ticketing.ticketing_system.dto.AgentPerformanceRequest;
import com.ticketing.ticketing_system.dto.DailyVolume;
import com.ticketing.ticketing_system.dto.DashboardSummary;
import com.ticketing.ticketing_system.service.MetricsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/metrics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Metrics", description = "Admin analytics and reporting endpoints")
@SecurityRequirement(name = "bearerAuth")
public class MetricsController {

    private final MetricsService metricsService;

    @GetMapping("/summary")
    @Operation(summary = "Get dashboard summary — ticket counts, avg resolution time, agent count")
    public ResponseEntity<DashboardSummary> getSummary() {
        return ResponseEntity.ok(metricsService.getDashboardSummary());
    }

    @GetMapping("/agents")
    @Operation(summary = "Get performance report for all agents")
    public ResponseEntity<List<AgentPerformanceRequest>> getAgentPerformance() {
        return ResponseEntity.ok(metricsService.getAgentPerformanceReport());
    }

    @GetMapping("/volume")
    @Operation(summary = "Get ticket volume per day for a date range")
    public ResponseEntity<List<DailyVolume>> getVolume(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        if (from.isAfter(to)) {
            throw new IllegalArgumentException("'from' date must not be after 'to' date");
        }

        return ResponseEntity.ok(metricsService.getTicketVolumeByDay(from, to));
    }
}