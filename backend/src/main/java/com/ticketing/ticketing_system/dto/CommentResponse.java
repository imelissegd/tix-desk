package com.ticketing.ticketing_system.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.ticketing.ticketing_system.model.Comment;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CommentResponse {

    private Long id;
    private Long ticketId;
    private TicketResponse.UserSummary author;
    private String content;
    
    @Getter(AccessLevel.NONE)
    @JsonProperty("isInternal")
    private boolean isInternal;
    
    private LocalDateTime createdAt;

    public static CommentResponse from(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .ticketId(comment.getTicket().getId())
                .author(TicketResponse.UserSummary.from(comment.getAuthor()))
                .content(comment.getContent())
                .isInternal(comment.isInternal())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}