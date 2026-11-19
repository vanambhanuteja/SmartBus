package com.nie.smartbus.service;

import com.nie.smartbus.dto.Dtos.*;
import com.nie.smartbus.entity.User;
import com.nie.smartbus.exception.ApiException;
import com.nie.smartbus.repository.UserRepository;
import com.nie.smartbus.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users; this.encoder = encoder; this.jwt = jwt;
    }

    /** Self-registration always creates a PASSENGER; admins are created only via ADMIN_EMAIL. */
    public AuthResponse register(RegisterRequest r) {
        String email = r.email().trim().toLowerCase();
        if (users.existsByEmail(email)) throw new ApiException(HttpStatus.CONFLICT, "Email is already registered");
        User u = new User();
        u.setFullName(r.fullName().trim());
        u.setEmail(email);
        u.setPasswordHash(encoder.encode(r.password()));
        u.setRole("PASSENGER");
        users.save(u);
        return toResponse(u);
    }

    public AuthResponse login(LoginRequest r) {
        User u = users.findByEmail(r.email().trim().toLowerCase())
                .filter(x -> encoder.matches(r.password(), x.getPasswordHash()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
        return toResponse(u);
    }

    private AuthResponse toResponse(User u) {
        return new AuthResponse(jwt.generate(u), u.getFullName(), u.getEmail(), u.getRole());
    }
}
