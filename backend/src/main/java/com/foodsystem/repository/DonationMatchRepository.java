package com.foodsystem.repository;

import com.foodsystem.model.DonationMatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface DonationMatchRepository extends JpaRepository<DonationMatch, Long> {

    List<DonationMatch> findAllByOrderByMatchedAtDesc();

    List<DonationMatch> findByRecipientIdOrderByMatchedAtDesc(Long recipientId);

    List<DonationMatch> findByFoodItemIdInOrderByMatchedAtDesc(Collection<Long> foodItemIds);
}
