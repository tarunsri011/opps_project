package com.foodsystem.dto;

import com.foodsystem.model.Role;

public record AuthResponse(
        String token,
        Long id,
        String name,
        String email,
        Role role
) {
}
