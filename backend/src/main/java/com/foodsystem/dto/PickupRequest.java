package com.foodsystem.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record PickupRequest(
        @NotNull Long donationMatchId,
        @NotNull LocalDateTime scheduledAt,
        String notes
) {
}
