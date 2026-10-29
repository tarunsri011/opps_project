package com.foodsystem.controller;

import com.foodsystem.dto.MonthlyCount;
import com.foodsystem.dto.StatisticsResponse;
import com.foodsystem.dto.WasteLogRequest;
import com.foodsystem.dto.WasteLogResponse;
import com.foodsystem.model.FoodItem;
import com.foodsystem.model.FoodStatus;
import com.foodsystem.model.MatchStatus;
import com.foodsystem.model.PickupStatus;
import com.foodsystem.model.WasteLog;
import com.foodsystem.repository.DonationMatchRepository;
import com.foodsystem.repository.FoodItemRepository;
import com.foodsystem.repository.PickupScheduleRepository;
import com.foodsystem.repository.WasteLogRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
public class StatisticsController {

    private final FoodItemRepository foodItemRepository;
    private final DonationMatchRepository donationMatchRepository;
    private final PickupScheduleRepository pickupScheduleRepository;
    private final WasteLogRepository wasteLogRepository;

    public StatisticsController(FoodItemRepository foodItemRepository,
                                DonationMatchRepository donationMatchRepository,
                                PickupScheduleRepository pickupScheduleRepository,
                                WasteLogRepository wasteLogRepository) {
        this.foodItemRepository = foodItemRepository;
        this.donationMatchRepository = donationMatchRepository;
        this.pickupScheduleRepository = pickupScheduleRepository;
        this.wasteLogRepository = wasteLogRepository;
    }

    @GetMapping("/api/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public StatisticsResponse statistics() {
        List<FoodItem> items = foodItemRepository.findAll();
        var matches = donationMatchRepository.findAll();
        var pickups = pickupScheduleRepository.findAll();
        var wasteLogs = wasteLogRepository.findAll();

        Map<String, Long> byCategory = new LinkedHashMap<>();
        items.forEach(i -> byCategory.merge(i.getCategory(), 1L, Long::sum));

        LocalDate today = LocalDate.now();
        long expiringIn3Days = items.stream()
                .filter(i -> !i.getExpiryDate().isAfter(today.plusDays(3)))
                .filter(i -> i.getStatus() != FoodStatus.DONATED)
                .count();

        double wastedQuantity = wasteLogs.stream()
                .mapToDouble(WasteLog::getQuantity)
                .sum();

        return new StatisticsResponse(
                items.size(),
                countItems(items, FoodStatus.AVAILABLE),
                countItems(items, FoodStatus.SURPLUS),
                countItems(items, FoodStatus.DONATED),
                countItems(items, FoodStatus.EXPIRED),
                matches.size(),
                countMatches(matches, MatchStatus.PENDING),
                countMatches(matches, MatchStatus.CONFIRMED),
                countMatches(matches, MatchStatus.COMPLETED),
                countMatches(matches, MatchStatus.CANCELLED),
                pickups.size(),
                pickups.stream().filter(p -> p.getStatus() == PickupStatus.COMPLETED).count(),
                wasteLogs.size(),
                wastedQuantity,
                expiringIn3Days,
                byCategory,
                wasteByMonth(wasteLogs));
    }

    @PostMapping("/api/waste-log")
    @PreAuthorize("hasRole('ADMIN')")
    public WasteLogResponse logWaste(@Valid @RequestBody WasteLogRequest request) {
        FoodItem item = foodItemRepository.findById(request.foodItemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Food item not found"));

        WasteLog log = new WasteLog();
        log.setFoodItemId(item.getId());
        log.setQuantity(request.quantity());
        log.setWastedAt(java.time.LocalDateTime.now());
        log.setReason(request.reason());
        WasteLog saved = wasteLogRepository.save(log);

        // Logging waste marks the item as expired
        item.setStatus(FoodStatus.EXPIRED);
        foodItemRepository.save(item);

        return new WasteLogResponse(saved.getId(), saved.getFoodItemId(),
                saved.getQuantity(), saved.getWastedAt(), saved.getReason());
    }

    private long countItems(List<FoodItem> items, FoodStatus status) {
        return items.stream().filter(i -> i.getStatus() == status).count();
    }

    private long countMatches(List<com.foodsystem.model.DonationMatch> matches, MatchStatus status) {
        return matches.stream().filter(m -> m.getStatus() == status).count();
    }

    /** Waste log counts for the last 6 months, oldest first. */
    private List<MonthlyCount> wasteByMonth(List<WasteLog> wasteLogs) {
        YearMonth current = YearMonth.now();
        List<YearMonth> months = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            months.add(current.minusMonths(i));
        }

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");
        return months.stream()
                .map(m -> new MonthlyCount(m.format(fmt), wasteLogs.stream()
                        .filter(w -> YearMonth.from(w.getWastedAt()).equals(m))
                        .count()))
                .toList();
    }
}
