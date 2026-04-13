package com.ticketing.ticketing_system.service;

import com.ticketing.ticketing_system.model.Role;
import com.ticketing.ticketing_system.model.TicketStatus;
import com.ticketing.ticketing_system.model.User;
import com.ticketing.ticketing_system.repository.TicketRepository;
import com.ticketing.ticketing_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class WorkloadService {

    private static final List<TicketStatus> ACTIVE_STATUSES =
            List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS);

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;

    /**
     * Returns the total priority weight of all OPEN/IN_PROGRESS tickets assigned to the agent.
     */
    public int getAgentWorkload(User agent) {
        return ticketRepository
                .findByAssignedToAndStatusIn(agent, ACTIVE_STATUSES)
                .stream()
                .mapToInt(t -> t.getPriority().getWeight())
                .sum();
    }

    /**
     * Finds the agent with the lowest current workload.
     * Returns empty Optional if no agents are registered in the system.
     */
    public Optional<User> findLeastLoadedAgent() {
        List<User> agents = userRepository.findByRole(Role.AGENT);

        if (agents.isEmpty()) {
            log.warn("No agents found in the system — ticket will be unassigned.");
            return Optional.empty();
        }

        return agents.stream()
                .min(Comparator.comparingInt(this::getAgentWorkload));
    }
}