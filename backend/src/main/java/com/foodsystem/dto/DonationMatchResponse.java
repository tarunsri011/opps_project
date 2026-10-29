package com.foodsystem.dto;

import com.foodsystem.model.MatchStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record DonationMatchResponse(
        Long id,
        Long foodItemId,
        String foodItemName,
        String category,
        Double quantity,
        String unit,
        LocalDate expiryDate,
        Long donorId,
        String donorName,
        Long recipientId,
        String recipientName,
        LocalDateTime matchedAt,
        MatchStatus status
) {
}
