package com.ticketing.ticketing_system.service;

import com.ticketing.ticketing_system.model.Comment;
import com.ticketing.ticketing_system.model.Role;
import com.ticketing.ticketing_system.model.Ticket;
import com.ticketing.ticketing_system.model.TicketStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    // ── helpers ───────────────────────────────────────────────────────────────

    private void send(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent to {}: {}", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    // ── notifications ─────────────────────────────────────────────────────────

    @Async
    public void sendTicketCreatedNotification(Ticket ticket) {
        String to = ticket.getCreatedBy().getEmail();
        String subject = "[TixDesk] Ticket #" + ticket.getId() + " Created";
        String body = String.format("""
                Hi %s,

                Your ticket has been successfully created.

                Ticket ID : #%d
                Title     : %s
                Priority  : %s
                Status    : %s
                Assigned To: %s

                We will get back to you as soon as possible.

                — TixDesk Support
                """,
                ticket.getCreatedBy().getName(),
                ticket.getId(),
                ticket.getTitle(),
                ticket.getPriority(),
                ticket.getStatus(),
                ticket.getAssignedTo() != null
                        ? ticket.getAssignedTo().getName()
                        : "Unassigned"
        );
        send(to, subject, body);
    }

    @Async
    public void sendCommentAddedNotification(Comment comment) {
        String authorRole = comment.getAuthor().getRole().name();
        String to = null;
        String recipientName = null;

        if (comment.getAuthor().getRole() == Role.AGENT
                || comment.getAuthor().getRole() == Role.ADMIN) {
            // Agent/Admin commented → notify the client
            to = comment.getTicket().getCreatedBy().getEmail();
            recipientName = comment.getTicket().getCreatedBy().getName();
        } else if (comment.getAuthor().getRole() == Role.CLIENT) {
            // Client commented → notify the assigned agent if present
            if (comment.getTicket().getAssignedTo() != null) {
                to = comment.getTicket().getAssignedTo().getEmail();
                recipientName = comment.getTicket().getAssignedTo().getName();
            }
        }

        if (to == null) return;

        String subject = "[TixDesk] New comment on Ticket #"
                + comment.getTicket().getId();
        String body = String.format("""
                Hi %s,

                A new comment has been added to Ticket #%d — "%s".

                From    : %s (%s)
                Comment : %s

                Log in to TixDesk to view the full conversation.

                — TixDesk Support
                """,
                recipientName,
                comment.getTicket().getId(),
                comment.getTicket().getTitle(),
                comment.getAuthor().getName(),
                authorRole,
                comment.getContent()
        );
        send(to, subject, body);
    }

    @Async
    public void sendStatusChangedNotification(Ticket ticket, TicketStatus oldStatus) {
        String to = ticket.getCreatedBy().getEmail();
        String subject = "[TixDesk] Ticket #" + ticket.getId() + " Status Updated";
        String body = String.format("""
                Hi %s,

                The status of your ticket has been updated.

                Ticket ID  : #%d
                Title      : %s
                Old Status : %s
                New Status : %s

                Log in to TixDesk to view more details.

                — TixDesk Support
                """,
                ticket.getCreatedBy().getName(),
                ticket.getId(),
                ticket.getTitle(),
                oldStatus,
                ticket.getStatus()
        );
        send(to, subject, body);
    }
}