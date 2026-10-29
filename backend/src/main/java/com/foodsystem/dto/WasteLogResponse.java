package com.foodsystem.dto;

import java.time.LocalDateTime;

public record WasteLogResponse(
        Long id,
        Long foodItemId,
        Double quantity,
        LocalDateTime wastedAt,
        String reason
) {
}
