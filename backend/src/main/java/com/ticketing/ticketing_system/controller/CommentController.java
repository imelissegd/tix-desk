package com.ticketing.ticketing_system.controller;

import com.ticketing.ticketing_system.dto.AddCommentRequest;
import com.ticketing.ticketing_system.dto.CommentResponse;
import com.ticketing.ticketing_system.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets/{ticketId}/comments")
@RequiredArgsConstructor
@Tag(name = "Comments", description = "Ticket comment and notes endpoints")
@SecurityRequirement(name = "bearerAuth")
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    @Operation(summary = "Add a comment to a ticket")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long ticketId,
            @Valid @RequestBody AddCommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(commentService.addComment(ticketId, request, userDetails));
    }

    @GetMapping
    @Operation(summary = "Get comments for a ticket (internal notes hidden from clients)")
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(commentService.getComments(ticketId, userDetails));
    }
}