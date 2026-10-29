package com.foodsystem.dto;

import com.foodsystem.model.FoodStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record FoodItemRequest(
        @NotBlank String name,
        @NotBlank String category,
        @NotNull Double quantity,
        @NotBlank String unit,
        @NotNull LocalDate expiryDate,
        String locationStored,
        FoodStatus status,
        Long donorId
) {
}
