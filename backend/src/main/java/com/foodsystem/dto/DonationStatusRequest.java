package com.foodsystem.dto;

import com.foodsystem.model.MatchStatus;
import jakarta.validation.constraints.NotNull;

public record DonationStatusRequest(
        @NotNull MatchStatus status
) {
}
