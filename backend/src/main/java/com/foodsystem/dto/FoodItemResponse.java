package com.foodsystem.dto;

import com.foodsystem.model.FoodStatus;

import java.time.LocalDate;

public record FoodItemResponse(
        Long id,
        String name,
        String category,
        Double quantity,
        String unit,
        LocalDate expiryDate,
        String locationStored,
        FoodStatus status,
        Long donorId,
        String donorName,
        Long daysToExpiry
) {
}
