package com.foodsystem.dto;

import java.util.List;
import java.util.Map;

public record StatisticsResponse(
        long totalItems,
        long availableItems,
        long surplusItems,
        long donatedItems,
        long expiredItems,
        long totalMatches,
        long pendingMatches,
        long confirmedMatches,
        long completedMatches,
        long cancelledMatches,
        long totalPickups,
        long completedPickups,
        long totalWasteLogs,
        double totalWastedQuantity,
        long expiringIn3Days,
        Map<String, Long> itemsByCategory,
        List<MonthlyCount> wasteByMonth
) {
}
