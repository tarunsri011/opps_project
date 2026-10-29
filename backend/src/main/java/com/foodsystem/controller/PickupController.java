package com.foodsystem.controller;

import com.foodsystem.dto.PickupRequest;
import com.foodsystem.dto.PickupResponse;
import com.foodsystem.model.DonationMatch;
import com.foodsystem.model.FoodItem;
import com.foodsystem.model.FoodStatus;
import com.foodsystem.model.MatchStatus;
import com.foodsystem.model.PickupSchedule;
import com.foodsystem.model.PickupStatus;
import com.foodsystem.model.Role;
import com.foodsystem.model.User;
import com.foodsystem.repository.DonationMatchRepository;
import com.foodsystem.repository.FoodItemRepository;
import com.foodsystem.repository.PickupScheduleRepository;
import com.foodsystem.repository.UserRepository;
import com.foodsystem.security.AuthContext;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/pickups")
public class PickupController {

    private final PickupScheduleRepository pickupScheduleRepository;
    private final DonationMatchRepository donationMatchRepository;
    private final FoodItemRepository foodItemRepository;
    private final UserRepository userRepository;

    public PickupController(PickupScheduleRepository pickupScheduleRepository,
                            DonationMatchRepository donationMatchRepository,
                            FoodItemRepository foodItemRepository,
                            UserRepository userRepository) {
        this.pickupScheduleRepository = pickupScheduleRepository;
        this.donationMatchRepository = donationMatchRepository;
        this.foodItemRepository = foodItemRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('RECIPIENT','ADMIN')")
    public List<PickupResponse> getAll() {
        List<PickupSchedule> pickups;

        if (AuthContext.hasRole(Role.ADMIN.name())) {
            pickups = pickupScheduleRepository.findAllByOrderByScheduledAtAsc();
        } else {
            List<Long> ownMatchIds = donationMatchRepository
                    .findByRecipientIdOrderByMatchedAtDesc(AuthContext.userId())
                    .stream().map(DonationMatch::getId).toList();
            pickups = pickupScheduleRepository.findByDonationMatchIdInOrderByScheduledAtAsc(ownMatchIds);
        }

        return pickups.stream().map(this::toResponse).toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RECIPIENT','ADMIN')")
    public ResponseEntity<PickupResponse> schedule(@Valid @RequestBody PickupRequest request) {
        DonationMatch match = donationMatchRepository.findById(request.donationMatchId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Donation match not found"));

        if (!AuthContext.hasRole(Role.ADMIN.name()) && !match.getRecipientId().equals(AuthContext.userId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only schedule pickups for your own matches");
        }
        if (match.getStatus() == MatchStatus.CANCELLED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot schedule a pickup for a cancelled match");
        }

        PickupSchedule pickup = new PickupSchedule();
        pickup.setDonationMatchId(match.getId());
        pickup.setScheduledAt(request.scheduledAt());
        pickup.setNotes(request.notes());
        pickup.setStatus(PickupStatus.SCHEDULED);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(toResponse(pickupScheduleRepository.save(pickup)));
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasRole('ADMIN')")
    public PickupResponse complete(@PathVariable Long id) {
        PickupSchedule pickup = pickupScheduleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pickup not found"));

        if (pickup.getStatus() == PickupStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup already completed");
        }

        pickup.setStatus(PickupStatus.COMPLETED);
        pickup.setPickedUpAt(LocalDateTime.now());
        pickupScheduleRepository.save(pickup);

        // Completing the pickup closes the donation match and the food item
        donationMatchRepository.findById(pickup.getDonationMatchId()).ifPresent(match -> {
            if (match.getStatus() != MatchStatus.CANCELLED) {
                match.setStatus(MatchStatus.COMPLETED);
                donationMatchRepository.save(match);
                foodItemRepository.findById(match.getFoodItemId()).ifPresent(item -> {
                    item.setStatus(FoodStatus.DONATED);
                    foodItemRepository.save(item);
                });
            }
        });

        return toResponse(pickup);
    }

    private PickupResponse toResponse(PickupSchedule pickup) {
        DonationMatch match = donationMatchRepository.findById(pickup.getDonationMatchId()).orElse(null);

        Long recipientId = match != null ? match.getRecipientId() : null;
        String recipientName = recipientId != null
                ? userRepository.findById(recipientId).map(User::getName).orElse(null) : null;
        String foodItemName = match != null
                ? foodItemRepository.findById(match.getFoodItemId()).map(FoodItem::getName).orElse(null) : null;

        return new PickupResponse(
                pickup.getId(),
                pickup.getDonationMatchId(),
                recipientId,
                recipientName,
                foodItemName,
                pickup.getScheduledAt(),
                pickup.getPickedUpAt(),
                pickup.getNotes(),
                pickup.getStatus());
    }
}
