package com.ticketing.ticketing_system.dto;

import com.ticketing.ticketing_system.model.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor   // ← Jackson needs this to deserialize JSON
@AllArgsConstructor  // ← @Builder needs this when @NoArgsConstructor is present
public class CreateTicketRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Priority is required")
    private TicketPriority priority;

    @Size(max = 100, message = "Category must not exceed 100 characters")
    private String category;
}