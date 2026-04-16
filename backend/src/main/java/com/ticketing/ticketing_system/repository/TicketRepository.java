package com.ticketing.ticketing_system.repository;
import java.util.Optional;
import com.ticketing.ticketing_system.model.Ticket;
import com.ticketing.ticketing_system.model.TicketStatus;
import com.ticketing.ticketing_system.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByAssignedTo(User agent);

    List<Ticket> findByCreatedBy(User client);

    List<Ticket> findByStatus(TicketStatus status);

    List<Ticket> findByAssignedToAndStatusIn(User agent, List<TicketStatus> statuses);

    long countByAssignedToAndStatusIn(User agent, List<TicketStatus> statuses);

    long countByStatus(TicketStatus status);

    List<Ticket> findByResolvedAtIsNotNull();

    List<Ticket> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    List<Ticket> findByAssignedTo_Id(Long agentId);

    @Query("SELECT t FROM Ticket t JOIN FETCH t.createdBy LEFT JOIN FETCH t.assignedTo WHERE t.id = :id")
    Optional<Ticket> findByIdWithUsers(@Param("id") Long id);

    @Query("SELECT t FROM Ticket t JOIN FETCH t.createdBy LEFT JOIN FETCH t.assignedTo WHERE t.createdBy = :user")
    List<Ticket> findByCreatedByWithUsers(@Param("user") User user);

    @Query("SELECT t FROM Ticket t JOIN FETCH t.createdBy LEFT JOIN FETCH t.assignedTo WHERE t.assignedTo = :agent")
    List<Ticket> findByAssignedToWithUsers(@Param("agent") User agent);

    @Query("SELECT t FROM Ticket t JOIN FETCH t.createdBy LEFT JOIN FETCH t.assignedTo")
    List<Ticket> findAllWithUsers();

    @Query("SELECT u.role, COUNT(u) FROM User u GROUP BY u.role")
    List<Object[]> countUsersByRole();
}