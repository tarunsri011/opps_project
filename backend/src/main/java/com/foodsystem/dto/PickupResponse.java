package com.foodsystem.dto;

import com.foodsystem.model.PickupStatus;

import java.time.LocalDateTime;

public record PickupResponse(
        Long id,
        Long donationMatchId,
        Long recipientId,
        String recipientName,
        String foodItemName,
        LocalDateTime scheduledAt,
        LocalDateTime pickedUpAt,
        String notes,
        PickupStatus status
) {
}
