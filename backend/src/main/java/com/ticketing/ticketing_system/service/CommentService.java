package com.ticketing.ticketing_system.service;

import com.ticketing.ticketing_system.dto.AddCommentRequest;
import com.ticketing.ticketing_system.dto.CommentResponse;
import com.ticketing.ticketing_system.model.*;
import com.ticketing.ticketing_system.repository.CommentRepository;
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
public class CommentService {

    private final CommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final EmailNotificationService emailNotificationService;

    private User resolveUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Authenticated user not found: " + userDetails.getUsername()));
    }

    private Ticket resolveTicket(Long ticketId) {
        return ticketRepository.findByIdWithUsers(ticketId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Ticket not found: " + ticketId));
    }

    @Transactional
    public CommentResponse addComment(Long ticketId, AddCommentRequest request,
                                      UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        Ticket ticket = resolveTicket(ticketId);

        // Clients cannot see or create internal notes
        boolean isInternal = caller.getRole() == Role.CLIENT
                ? false
                : request.isInternal();

        // Clients can only comment on their own tickets
        if (caller.getRole() == Role.CLIENT
                && !ticket.getCreatedBy().getId().equals(caller.getId())) {
            throw new AccessDeniedException(
                    "You do not have access to ticket " + ticketId);
        }

        Comment comment = Comment.builder()
                .ticket(ticket)
                .author(caller)
                .content(request.getContent())
                .isInternal(isInternal)
                .build();

        Comment saved = commentRepository.save(comment);
        log.info("Comment {} added to ticket {} by {}", saved.getId(), ticketId,
                caller.getEmail());

        // Fire-and-forget — failure won't roll back the comment save
        if (!isInternal) {
            emailNotificationService.sendCommentAddedNotification(saved);
        }

        return CommentResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long ticketId, UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        Ticket ticket = resolveTicket(ticketId);

        // Clients can only read comments on their own tickets
        if (caller.getRole() == Role.CLIENT
                && !ticket.getCreatedBy().getId().equals(caller.getId())) {
            throw new AccessDeniedException(
                    "You do not have access to ticket " + ticketId);
        }

        List<Comment> comments = caller.getRole() == Role.CLIENT
                ? commentRepository.findByTicketIdAndIsInternalFalseOrderByCreatedAtAsc(ticketId)
                : commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);

        return comments.stream().map(CommentResponse::from).toList();
    }
}