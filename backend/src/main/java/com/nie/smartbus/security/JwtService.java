package com.nie.smartbus.security;

import com.nie.smartbus.config.AppProperties;
import com.nie.smartbus.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expiryMinutes;

    public JwtService(AppProperties props) {
        if (props.jwtSecret() == null || props.jwtSecret().length() < 32) {
            throw new IllegalStateException("JWT_SECRET must be set to at least 32 characters (see .env.example)");
        }
        this.key = Keys.hmacShaKeyFor(props.jwtSecret().getBytes(StandardCharsets.UTF_8));
        this.expiryMinutes = props.jwtExpiryMinutes() > 0 ? props.jwtExpiryMinutes() : 120;
    }

    public String generate(User user) {
        Instant now = Instant.now();
        return Jwts.builder().subject(user.getEmail()).claim("role", user.getRole())
                .issuedAt(Date.from(now)).expiration(Date.from(now.plusSeconds(expiryMinutes * 60)))
                .signWith(key).compact();
    }

    /** Returns the claims if the token is valid and not expired, otherwise empty. */
    public Optional<Claims> parse(String token) {
        try {
            return Optional.of(Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload());
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
