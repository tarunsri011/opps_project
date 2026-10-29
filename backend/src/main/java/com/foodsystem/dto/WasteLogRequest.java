package com.foodsystem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record WasteLogRequest(
        @NotNull Long foodItemId,
        @NotNull Double quantity,
        @NotBlank String reason
) {
}
