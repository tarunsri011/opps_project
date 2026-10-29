package com.foodsystem.dto;

import jakarta.validation.constraints.NotNull;

public record DonationMatchRequest(
        @NotNull Long foodItemId,
        @NotNull Long recipientId
) {
}
