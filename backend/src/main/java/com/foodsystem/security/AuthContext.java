package com.foodsystem.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Convenience access to the authenticated caller set up by {@link JwtFilter}.
 */
public final class AuthContext {

    private AuthContext() {
    }

    /** Id of the current user (the JWT subject). */
    public static Long userId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return Long.parseLong(auth.getName());
    }

    /** True when the caller holds the given role (e.g. role("ADMIN")). */
    public static boolean hasRole(String role) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }
}
