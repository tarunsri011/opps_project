package com.foodsystem.controller;

import com.foodsystem.dto.RegisterRequest;
import com.foodsystem.dto.UserResponse;
import com.foodsystem.model.Role;
import com.foodsystem.model.User;
import com.foodsystem.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/recipients")
@PreAuthorize("hasRole('ADMIN')")
public class RecipientController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public RecipientController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<UserResponse> getAll() {
        return userRepository.findByRole(Role.RECIPIENT).stream()
                .map(u -> new UserResponse(u.getId(), u.getName(), u.getEmail(), u.getRole()))
                .toList();
    }

    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = new User(request.name(), request.email(),
                passwordEncoder.encode(request.password()), Role.RECIPIENT);
        userRepository.save(user);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole()));
    }
}
