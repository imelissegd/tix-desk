package com.ticketing.ticketing_system.service;

import com.ticketing.ticketing_system.dto.CreateTicketRequest;
import com.ticketing.ticketing_system.dto.TicketResponse;
import com.ticketing.ticketing_system.model.*;
import com.ticketing.ticketing_system.repository.TicketRepository;
import com.ticketing.ticketing_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final WorkloadService workloadService;

    // ── helpers ──────────────────────────────────────────────────────────────

    private User resolveUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Authenticated user not found: " + userDetails.getUsername()));
    }

    // ── write ─────────────────────────────────────────────────────────────────

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

        return TicketResponse.from(saved);
    }

    // ── read ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public TicketResponse getTicketById(Long id, UserDetails userDetails) {
        User caller = resolveUser(userDetails);

        Ticket ticket = ticketRepository.findByIdWithUsers(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found: " + id));

        if (caller.getRole() == Role.CLIENT && !ticket.getCreatedBy().getId().equals(caller.getId())) {
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

        return tickets.stream()
                .map(TicketResponse::from)
                .toList();
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

}