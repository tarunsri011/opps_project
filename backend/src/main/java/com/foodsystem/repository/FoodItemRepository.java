package com.foodsystem.repository;

import com.foodsystem.model.FoodItem;
import com.foodsystem.model.FoodStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {

    List<FoodItem> findAllByOrderByExpiryDateAsc();

    List<FoodItem> findByStatusOrderByExpiryDateAsc(FoodStatus status);

    List<FoodItem> findByDonorIdOrderByExpiryDateAsc(Long donorId);

    List<FoodItem> findByExpiryDateLessThanEqualOrderByExpiryDateAsc(LocalDate deadline);
}
