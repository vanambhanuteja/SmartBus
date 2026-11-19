package com.nie.smartbus.config;

import com.nie.smartbus.entity.User;
import com.nie.smartbus.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/** Creates the first administrator from ADMIN_EMAIL / ADMIN_PASSWORD (environment variables). */
@Component
public class DataInitializer implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AppProperties props;

    public DataInitializer(UserRepository users, PasswordEncoder encoder, AppProperties props) {
        this.users = users; this.encoder = encoder; this.props = props;
    }

    @Override
    public void run(String... args) {
        String email = props.adminEmail(), pw = props.adminPassword();
        if (email == null || email.isBlank() || pw == null || pw.isBlank()) {
            log.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set - no administrator account created");
            return;
        }
        if (users.existsByEmail(email)) return;
        User admin = new User();
        admin.setFullName("Administrator");
        admin.setEmail(email.toLowerCase());
        admin.setPasswordHash(encoder.encode(pw));
        admin.setRole("ADMIN");
        users.save(admin);
        log.info("Administrator account created for {}", email);
    }
}
