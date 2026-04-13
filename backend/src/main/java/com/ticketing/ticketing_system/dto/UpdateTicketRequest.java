package com.ticketing.ticketing_system.dto;

import com.ticketing.ticketing_system.model.TicketPriority;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTicketRequest {

    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    private String description;

    private TicketPriority priority;

    @Size(max = 100, message = "Category must not exceed 100 characters")
    private String category;
}