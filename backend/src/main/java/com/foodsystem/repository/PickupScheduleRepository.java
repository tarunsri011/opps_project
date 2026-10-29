package com.foodsystem.repository;

import com.foodsystem.model.PickupSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface PickupScheduleRepository extends JpaRepository<PickupSchedule, Long> {

    List<PickupSchedule> findAllByOrderByScheduledAtAsc();

    List<PickupSchedule> findByDonationMatchIdInOrderByScheduledAtAsc(Collection<Long> matchIds);
}
