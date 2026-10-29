package com.foodsystem.repository;

import com.foodsystem.model.WasteLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WasteLogRepository extends JpaRepository<WasteLog, Long> {

    List<WasteLog> findAllByOrderByWastedAtDesc();
}
