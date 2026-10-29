package com.foodsystem.dto;

import com.foodsystem.model.Role;

public record UserResponse(
        Long id,
        String name,
        String email,
        Role role
) {
}
