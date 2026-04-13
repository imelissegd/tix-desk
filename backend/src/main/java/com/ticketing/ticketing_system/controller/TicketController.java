package com.ticketing.ticketing_system.controller;

import com.ticketing.ticketing_system.dto.*;
import com.ticketing.ticketing_system.model.TicketStatus;
import com.ticketing.ticketing_system.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@Tag(name = "Tickets", description = "Ticket management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    @Operation(summary = "Create a new ticket")
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody CreateTicketRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.createTicket(request, userDetails));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get ticket by ID")
    public ResponseEntity<TicketResponse> getTicketById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ticketService.getTicketById(id, userDetails));
    }

    @GetMapping("/my")
    @Operation(summary = "Get tickets for the current user (role-aware)")
    public ResponseEntity<List<TicketResponse>> getMyTickets(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ticketService.getMyTickets(userDetails));
    }

    @GetMapping
    @Operation(summary = "Get all tickets (ADMIN and AGENT only)")
    public ResponseEntity<List<TicketResponse>> getAllTickets(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ticketService.getAllTickets(userDetails));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update ticket fields (ADMIN or assigned AGENT)")
    public ResponseEntity<TicketResponse> updateTicket(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTicketRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ticketService.updateTicket(id, request, userDetails));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Change ticket status (ADMIN or assigned AGENT)")
    public ResponseEntity<TicketResponse> changeStatus(
            @PathVariable Long id,
            @Valid @RequestBody ChangeStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                ticketService.changeStatus(id, request.getStatus(), userDetails));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Assign ticket to an agent (ADMIN only)")
    public ResponseEntity<TicketResponse> assignTicket(
            @PathVariable Long id,
            @Valid @RequestBody AssignTicketRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                ticketService.assignTicket(id, request.getAgentId(), userDetails));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a ticket (ADMIN only)")
    public ResponseEntity<Void> deleteTicket(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        ticketService.deleteTicket(id, userDetails);
        return ResponseEntity.noContent().build();
    }
}