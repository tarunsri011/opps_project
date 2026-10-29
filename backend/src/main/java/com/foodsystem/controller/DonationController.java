package com.foodsystem.controller;

import com.foodsystem.dto.DonationMatchRequest;
import com.foodsystem.dto.DonationMatchResponse;
import com.foodsystem.dto.DonationStatusRequest;
import com.foodsystem.model.DonationMatch;
import com.foodsystem.model.FoodItem;
import com.foodsystem.model.FoodStatus;
import com.foodsystem.model.MatchStatus;
import com.foodsystem.model.Role;
import com.foodsystem.model.User;
import com.foodsystem.repository.DonationMatchRepository;
import com.foodsystem.repository.FoodItemRepository;
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

import java.util.List;

@RestController
@RequestMapping("/api/donations")
public class DonationController {

    private final DonationMatchRepository donationMatchRepository;
    private final FoodItemRepository foodItemRepository;
    private final UserRepository userRepository;

    public DonationController(DonationMatchRepository donationMatchRepository,
                              FoodItemRepository foodItemRepository,
                              UserRepository userRepository) {
        this.donationMatchRepository = donationMatchRepository;
        this.foodItemRepository = foodItemRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<DonationMatchResponse> getAll() {
        List<DonationMatch> matches;

        if (AuthContext.hasRole(Role.ADMIN.name())) {
            matches = donationMatchRepository.findAllByOrderByMatchedAtDesc();
        } else if (AuthContext.hasRole(Role.RECIPIENT.name())) {
            matches = donationMatchRepository.findByRecipientIdOrderByMatchedAtDesc(AuthContext.userId());
        } else {
            // DONOR: matches covering their own food items
            List<Long> ownItemIds = foodItemRepository.findByDonorIdOrderByExpiryDateAsc(AuthContext.userId())
                    .stream().map(FoodItem::getId).toList();
            matches = donationMatchRepository.findByFoodItemIdInOrderByMatchedAtDesc(ownItemIds);
        }

        return matches.stream().map(this::toResponse).toList();
    }

    @PostMapping("/match")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DonationMatchResponse> match(@Valid @RequestBody DonationMatchRequest request) {
        FoodItem item = foodItemRepository.findById(request.foodItemId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Food item not found"));
        User recipient = userRepository.findById(request.recipientId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recipient not found"));

        if (item.getStatus() != FoodStatus.SURPLUS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only surplus food items can be matched");
        }
        if (recipient.getRole() != Role.RECIPIENT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target user is not a recipient");
        }
        boolean alreadyMatched = donationMatchRepository.findAll().stream()
                .anyMatch(m -> m.getFoodItemId().equals(item.getId())
                        && m.getStatus() != MatchStatus.CANCELLED);
        if (alreadyMatched) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Food item already has an active match");
        }

        DonationMatch match = donationMatchRepository.save(new DonationMatch(item.getId(), recipient.getId()));
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(match));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','RECIPIENT')")
    public DonationMatchResponse updateStatus(@PathVariable Long id,
                                              @Valid @RequestBody DonationStatusRequest request) {
        DonationMatch match = donationMatchRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Donation match not found"));

        // Ownership check: recipients may only update their own matches
        if (!AuthContext.hasRole(Role.ADMIN.name()) && !match.getRecipientId().equals(AuthContext.userId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only update your own donation matches");
        }

        MatchStatus next = request.status();
        if (match.getStatus() == MatchStatus.CANCELLED || match.getStatus() == MatchStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Match is already " + match.getStatus() + " and cannot be changed");
        }
        if (next == MatchStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot set a match back to PENDING");
        }

        match.setStatus(next);
        donationMatchRepository.save(match);

        // Keep the food item status in sync with the match outcome
        foodItemRepository.findById(match.getFoodItemId()).ifPresent(item -> {
            if (next == MatchStatus.CONFIRMED || next == MatchStatus.COMPLETED) {
                item.setStatus(FoodStatus.DONATED);
            } else if (next == MatchStatus.CANCELLED && item.getStatus() == FoodStatus.DONATED) {
                item.setStatus(FoodStatus.SURPLUS);
            }
            foodItemRepository.save(item);
        });

        return toResponse(match);
    }

    private DonationMatchResponse toResponse(DonationMatch match) {
        FoodItem item = foodItemRepository.findById(match.getFoodItemId()).orElse(null);
        String donorName = null;
        String recipientName = userRepository.findById(match.getRecipientId()).map(User::getName).orElse(null);

        if (item != null) {
            donorName = userRepository.findById(item.getDonorId()).map(User::getName).orElse(null);
        }

        return new DonationMatchResponse(
                match.getId(),
                match.getFoodItemId(),
                item != null ? item.getName() : "(deleted)",
                item != null ? item.getCategory() : null,
                item != null ? item.getQuantity() : null,
                item != null ? item.getUnit() : null,
                item != null ? item.getExpiryDate() : null,
                item != null ? item.getDonorId() : null,
                donorName,
                match.getRecipientId(),
                recipientName,
                match.getMatchedAt(),
                match.getStatus());
    }
}
