package com.ticketing.ticketing_system.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
public class DailyVolume {

    private LocalDate date;
    private long count;
}