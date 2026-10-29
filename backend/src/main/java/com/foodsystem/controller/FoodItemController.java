package com.foodsystem.controller;

import com.foodsystem.dto.FoodItemRequest;
import com.foodsystem.dto.FoodItemResponse;
import com.foodsystem.model.DonationMatch;
import com.foodsystem.model.FoodItem;
import com.foodsystem.model.FoodStatus;
import com.foodsystem.model.Role;
import com.foodsystem.model.User;
import com.foodsystem.repository.DonationMatchRepository;
import com.foodsystem.repository.FoodItemRepository;
import com.foodsystem.repository.PickupScheduleRepository;
import com.foodsystem.repository.UserRepository;
import com.foodsystem.repository.WasteLogRepository;
import com.foodsystem.security.AuthContext;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/food-items")
public class FoodItemController {

    private final FoodItemRepository foodItemRepository;
    private final UserRepository userRepository;
    private final DonationMatchRepository donationMatchRepository;
    private final PickupScheduleRepository pickupScheduleRepository;
    private final WasteLogRepository wasteLogRepository;

    public FoodItemController(FoodItemRepository foodItemRepository,
                              UserRepository userRepository,
                              DonationMatchRepository donationMatchRepository,
                              PickupScheduleRepository pickupScheduleRepository,
                              WasteLogRepository wasteLogRepository) {
        this.foodItemRepository = foodItemRepository;
        this.userRepository = userRepository;
        this.donationMatchRepository = donationMatchRepository;
        this.pickupScheduleRepository = pickupScheduleRepository;
        this.wasteLogRepository = wasteLogRepository;
    }

    @GetMapping
    public List<FoodItemResponse> getAll() {
        return toResponses(foodItemRepository.findAllByOrderByExpiryDateAsc());
    }

    @GetMapping("/surplus")
    public List<FoodItemResponse> getSurplus() {
        return toResponses(foodItemRepository.findByStatusOrderByExpiryDateAsc(FoodStatus.SURPLUS));
    }

    @GetMapping("/expiring-soon")
    @PreAuthorize("hasRole('ADMIN')")
    public List<FoodItemResponse> getExpiringSoon() {
        LocalDate deadline = LocalDate.now().plusDays(3);
        return toResponses(foodItemRepository.findByExpiryDateLessThanEqualOrderByExpiryDateAsc(deadline));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('DONOR','ADMIN')")
    public ResponseEntity<FoodItemResponse> create(@Valid @RequestBody FoodItemRequest request) {
        Long donorId = AuthContext.hasRole(Role.ADMIN.name())
                ? (request.donorId() != null ? request.donorId() : AuthContext.userId())
                : AuthContext.userId();

        User donor = userRepository.findById(donorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Donor not found"));

        FoodItem item = new FoodItem();
        item.setName(request.name());
        item.setCategory(request.category());
        item.setQuantity(request.quantity());
        item.setUnit(request.unit());
        item.setExpiryDate(request.expiryDate());
        item.setLocationStored(request.locationStored());
        item.setStatus(request.status() != null ? request.status() : FoodStatus.AVAILABLE);
        item.setDonorId(donor.getId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(toResponse(foodItemRepository.save(item)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DONOR','ADMIN')")
    public FoodItemResponse update(@PathVariable Long id, @Valid @RequestBody FoodItemRequest request) {
        FoodItem item = findOrThrow(id);

        // Ownership check: donors may only touch their own items
        if (!AuthContext.hasRole(Role.ADMIN.name()) && !item.getDonorId().equals(AuthContext.userId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own food items");
        }

        item.setName(request.name());
        item.setCategory(request.category());
        item.setQuantity(request.quantity());
        item.setUnit(request.unit());
        item.setExpiryDate(request.expiryDate());
        item.setLocationStored(request.locationStored());
        if (request.status() != null) {
            item.setStatus(request.status());
        }

        return toResponse(foodItemRepository.save(item));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        FoodItem item = findOrThrow(id);

        // Flat schema: remove dependent rows explicitly to avoid dangling references
        List<DonationMatch> matches = donationMatchRepository.findAll().stream()
                .filter(m -> m.getFoodItemId().equals(id))
                .toList();
        List<Long> matchIds = matches.stream().map(DonationMatch::getId).toList();

        pickupScheduleRepository.findAll().stream()
                .filter(p -> matchIds.contains(p.getDonationMatchId()))
                .forEach(pickupScheduleRepository::delete);
        matches.forEach(donationMatchRepository::delete);
        wasteLogRepository.findAll().stream()
                .filter(w -> w.getFoodItemId().equals(id))
                .forEach(wasteLogRepository::delete);
        foodItemRepository.delete(item);

        return ResponseEntity.noContent().build();
    }

    private FoodItem findOrThrow(Long id) {
        return foodItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Food item not found"));
    }

    private List<FoodItemResponse> toResponses(List<FoodItem> items) {
        Map<Long, String> donorNames = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, User::getName, (a, b) -> a));
        return items.stream()
                .map(item -> toResponse(item, donorNames.get(item.getDonorId())))
                .toList();
    }

    private FoodItemResponse toResponse(FoodItem item) {
        String donorName = userRepository.findById(item.getDonorId())
                .map(User::getName).orElse(null);
        return toResponse(item, donorName);
    }

    private FoodItemResponse toResponse(FoodItem item, String donorName) {
        long days = ChronoUnit.DAYS.between(LocalDate.now(), item.getExpiryDate());
        return new FoodItemResponse(
                item.getId(), item.getName(), item.getCategory(), item.getQuantity(), item.getUnit(),
                item.getExpiryDate(), item.getLocationStored(), item.getStatus(),
                item.getDonorId(), donorName, days);
    }
}
