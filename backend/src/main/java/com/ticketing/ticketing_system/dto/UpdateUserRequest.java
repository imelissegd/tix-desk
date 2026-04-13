package com.ticketing.ticketing_system.dto;

import com.ticketing.ticketing_system.model.Role;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {

    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    private Role role;
}