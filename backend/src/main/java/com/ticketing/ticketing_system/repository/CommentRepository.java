package com.ticketing.ticketing_system.repository;

import com.ticketing.ticketing_system.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    @Query("SELECT c FROM Comment c JOIN FETCH c.author WHERE c.ticket.id = :ticketId ORDER BY c.createdAt ASC")
    List<Comment> findByTicketIdOrderByCreatedAtAsc(@Param("ticketId") Long ticketId);

    @Query("SELECT c FROM Comment c JOIN FETCH c.author WHERE c.ticket.id = :ticketId AND c.isInternal = false ORDER BY c.createdAt ASC")
    List<Comment> findByTicketIdAndIsInternalFalseOrderByCreatedAtAsc(@Param("ticketId") Long ticketId);
}