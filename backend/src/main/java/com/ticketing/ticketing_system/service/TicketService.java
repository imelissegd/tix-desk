package com.ticketing.ticketing_system.service;

import com.ticketing.ticketing_system.dto.*;
import com.ticketing.ticketing_system.model.*;
import com.ticketing.ticketing_system.repository.TicketRepository;
import com.ticketing.ticketing_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final WorkloadService workloadService;
    private final EmailNotificationService emailNotificationService;


    // ── helpers ───────────────────────────────────────────────────────────────

    private User resolveUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Authenticated user not found: " + userDetails.getUsername()));
    }

    private Ticket resolveTicket(Long id) {
        return ticketRepository.findByIdWithUsers(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + id));
    }

    // ── create ────────────────────────────────────────────────────────────────

    @Transactional
    public TicketResponse createTicket(CreateTicketRequest request, UserDetails userDetails) {
        User caller = resolveUser(userDetails);

        User assignedTo = workloadService.findLeastLoadedAgent().orElse(null);

        Ticket ticket = Ticket.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .category(request.getCategory())
                .status(TicketStatus.OPEN)
                .createdBy(caller)
                .assignedTo(assignedTo)
                .build();

        Ticket saved = ticketRepository.save(ticket);
        log.info("Ticket {} created by {} — assigned to {}",
                saved.getId(), caller.getEmail(),
                assignedTo != null ? assignedTo.getEmail() : "nobody");

        emailNotificationService.sendTicketCreatedNotification(saved);

        return TicketResponse.from(saved);
    }

    // ── read ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public TicketResponse getTicketById(Long id, UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        Ticket ticket = resolveTicket(id);

        if (caller.getRole() == Role.CLIENT
                && !ticket.getCreatedBy().getId().equals(caller.getId())) {
            throw new AccessDeniedException("You do not have access to ticket " + id);
        }

        return TicketResponse.from(ticket);
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getMyTickets(UserDetails userDetails) {
        User caller = resolveUser(userDetails);

        List<Ticket> tickets = switch (caller.getRole()) {
            case CLIENT -> ticketRepository.findByCreatedByWithUsers(caller);
            case AGENT  -> ticketRepository.findByAssignedToWithUsers(caller);
            case ADMIN  -> ticketRepository.findAllWithUsers();
        };

        return tickets.stream().map(TicketResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<TicketResponse> getAllTickets(UserDetails userDetails) {
        User caller = resolveUser(userDetails);

        if (caller.getRole() == Role.CLIENT) {
            throw new AccessDeniedException("Clients cannot access the full ticket list");
        }

        return ticketRepository.findAllWithUsers()
                .stream()
                .map(TicketResponse::from)
                .toList();
    }

    // ── update ────────────────────────────────────────────────────────────────

    @Transactional
    public TicketResponse updateTicket(Long id, UpdateTicketRequest request,
                                       UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        Ticket ticket = resolveTicket(id);

        boolean isAdmin = caller.getRole() == Role.ADMIN;
        boolean isAssignedAgent = caller.getRole() == Role.AGENT
                && ticket.getAssignedTo() != null
                && ticket.getAssignedTo().getId().equals(caller.getId());

        if (!isAdmin && !isAssignedAgent) {
            throw new AccessDeniedException("You do not have permission to update ticket " + id);
        }

        if (request.getTitle() != null)       ticket.setTitle(request.getTitle());
        if (request.getDescription() != null) ticket.setDescription(request.getDescription());
        if (request.getPriority() != null)    ticket.setPriority(request.getPriority());
        if (request.getCategory() != null)    ticket.setCategory(request.getCategory());

        return TicketResponse.from(ticketRepository.save(ticket));
    }

    // ── status change ─────────────────────────────────────────────────────────

    @Transactional
    public TicketResponse changeStatus(Long id, TicketStatus newStatus,
                                       UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        Ticket ticket = resolveTicket(id);

        if (caller.getRole() == Role.CLIENT) {
            throw new AccessDeniedException("Clients cannot change ticket status");
        }

        boolean isAdmin = caller.getRole() == Role.ADMIN;
        boolean isAssignedAgent = caller.getRole() == Role.AGENT
                && ticket.getAssignedTo() != null
                && ticket.getAssignedTo().getId().equals(caller.getId());

        if (!isAdmin && !isAssignedAgent) {
            throw new AccessDeniedException(
                    "Only the assigned agent or an admin can change this ticket's status");
        }

        TicketStatus oldStatus = ticket.getStatus();
        ticket.setStatus(newStatus);

        if (newStatus == TicketStatus.RESOLVED) {
            ticket.setResolvedAt(LocalDateTime.now());
        }

        Ticket saved = ticketRepository.save(ticket);
        log.info("Ticket {} status changed from {} to {} by {}",
                id, oldStatus, newStatus, caller.getEmail());

        emailNotificationService.sendStatusChangedNotification(saved, oldStatus);

        return TicketResponse.from(saved);
    }

    // ── assign ────────────────────────────────────────────────────────────────

    @Transactional
    public TicketResponse assignTicket(Long id, Long agentId, UserDetails userDetails) {
        // @PreAuthorize("hasRole('ADMIN')") handles the role check in the controller
        Ticket ticket = resolveTicket(id);

        User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + agentId));

        if (agent.getRole() != Role.AGENT) {
            throw new IllegalArgumentException(
                    "User " + agentId + " is not an AGENT");
        }

        ticket.setAssignedTo(agent);
        return TicketResponse.from(ticketRepository.save(ticket));
    }

    // ── delete ────────────────────────────────────────────────────────────────

    @Transactional
    public void deleteTicket(Long id, UserDetails userDetails) {
        // @PreAuthorize("hasRole('ADMIN')") handles the role check in the controller
        Ticket ticket = resolveTicket(id);
        ticketRepository.delete(ticket);
        log.info("Ticket {} deleted by {}", id, userDetails.getUsername());
    }
}