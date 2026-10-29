package com.foodsystem.config;

import com.foodsystem.model.DonationMatch;
import com.foodsystem.model.FoodItem;
import com.foodsystem.model.FoodStatus;
import com.foodsystem.model.MatchStatus;
import com.foodsystem.model.PickupSchedule;
import com.foodsystem.model.PickupStatus;
import com.foodsystem.model.Role;
import com.foodsystem.model.User;
import com.foodsystem.model.WasteLog;
import com.foodsystem.repository.DonationMatchRepository;
import com.foodsystem.repository.FoodItemRepository;
import com.foodsystem.repository.PickupScheduleRepository;
import com.foodsystem.repository.UserRepository;
import com.foodsystem.repository.WasteLogRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Seeds demo data on the first run (only when the users table is empty).
 * Using a runner instead of data.sql avoids the Spring Boot 3 schema-init ordering trap.
 *
 * Demo accounts:
 *   admin@food.org / admin123     (ADMIN)
 *   donor@food.org / donor123     (DONOR)
 *   recipient@food.org / recip123 (RECIPIENT)
 */
@Component
public class SeedData implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FoodItemRepository foodItemRepository;
    private final DonationMatchRepository donationMatchRepository;
    private final PickupScheduleRepository pickupScheduleRepository;
    private final WasteLogRepository wasteLogRepository;
    private final PasswordEncoder passwordEncoder;

    public SeedData(UserRepository userRepository,
                    FoodItemRepository foodItemRepository,
                    DonationMatchRepository donationMatchRepository,
                    PickupScheduleRepository pickupScheduleRepository,
                    WasteLogRepository wasteLogRepository,
                    PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.foodItemRepository = foodItemRepository;
        this.donationMatchRepository = donationMatchRepository;
        this.pickupScheduleRepository = pickupScheduleRepository;
        this.wasteLogRepository = wasteLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        userRepository.save(new User("Admin", "admin@food.org",
                passwordEncoder.encode("admin123"), Role.ADMIN));
        User donor = userRepository.save(
                new User("Campus Canteen", "donor@food.org", passwordEncoder.encode("donor123"), Role.DONOR));
        User recipient = userRepository.save(
                new User("Shelter Hope", "recipient@food.org", passwordEncoder.encode("recip123"), Role.RECIPIENT));
        userRepository.save(new User("Community Food Bank", "community@food.org",
                passwordEncoder.encode("recip123"), Role.RECIPIENT));

        foodItem(donor, "Bread loaves", "Bakery", 20.0, "loaves",
                LocalDate.now().plusDays(1), "Cold store A", FoodStatus.AVAILABLE);
        foodItem(donor, "Milk", "Dairy", 30.0, "litres",
                LocalDate.now().plusDays(2), "Fridge 1", FoodStatus.AVAILABLE);
        FoodItem sandwiches = foodItem(donor, "Sandwiches", "Prepared Meals", 15.0, "packs",
                LocalDate.now(), "Counter fridge", FoodStatus.SURPLUS);
        foodItem(donor, "Apples", "Produce", 50.0, "kg",
                LocalDate.now().plusDays(5), "Cold store B", FoodStatus.AVAILABLE);
        foodItem(donor, "Rice bags", "Grains", 40.0, "bags",
                LocalDate.now().plusDays(120), "Dry store", FoodStatus.AVAILABLE);
        FoodItem expiredMilk = foodItem(donor, "Sour cream", "Dairy", 5.0, "tubs",
                LocalDate.now().minusDays(2), "Fridge 1", FoodStatus.EXPIRED);

        DonationMatch match = new DonationMatch(sandwiches.getId(), recipient.getId());
        match.setStatus(MatchStatus.CONFIRMED);
        match = donationMatchRepository.save(match);

        PickupSchedule pickup = new PickupSchedule();
        pickup.setDonationMatchId(match.getId());
        pickup.setScheduledAt(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0));
        pickup.setNotes("Side entrance, ring the bell");
        pickup.setStatus(PickupStatus.SCHEDULED);
        pickupScheduleRepository.save(pickup);

        WasteLog waste = new WasteLog();
        waste.setFoodItemId(expiredMilk.getId());
        waste.setQuantity(5.0);
        waste.setWastedAt(LocalDateTime.now().minusDays(1));
        waste.setReason("Passed expiry date before collection");
        wasteLogRepository.save(waste);
    }

    private FoodItem foodItem(User donor, String name, String category, Double quantity, String unit,
                               LocalDate expiryDate, String location, FoodStatus status) {
        FoodItem item = new FoodItem();
        item.setName(name);
        item.setCategory(category);
        item.setQuantity(quantity);
        item.setUnit(unit);
        item.setExpiryDate(expiryDate);
        item.setLocationStored(location);
        item.setStatus(status);
        item.setDonorId(donor.getId());
        return foodItemRepository.save(item);
    }
}
