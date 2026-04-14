package com.ticketing.ticketing_system.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
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
public class AddCommentRequest {

    @NotBlank(message = "Content is required")
    private String content;

    @Getter(AccessLevel.NONE)
    @JsonProperty("isInternal")
    @Builder.Default
    private boolean isInternal = false;

    @JsonIgnore
    public boolean isInternal() {
        return isInternal;
    }
}