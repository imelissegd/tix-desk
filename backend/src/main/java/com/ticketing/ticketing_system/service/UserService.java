package com.ticketing.ticketing_system.service;

import com.ticketing.ticketing_system.dto.UpdateUserRequest;
import com.ticketing.ticketing_system.dto.UserResponse;
import com.ticketing.ticketing_system.model.User;
import com.ticketing.ticketing_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // ----------------------------------------------------------------
    // UserDetailsService — called by Spring Security on every request
    // ----------------------------------------------------------------

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "No user found with email: " + email));

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                user.isEnabled(),  // ← enabled
                true,              // accountNonExpired
                true,          // credentialsNonExpired
                true,               // accountNonLocked
                user.getRole().getAuthorities()
        );
    }

    // ----------------------------------------------------------------
    // getUserById
    // ----------------------------------------------------------------

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        return UserResponse.from(user);
    }

    // ----------------------------------------------------------------
    // updateUser — users update themselves; admin can update anyone
    // ----------------------------------------------------------------

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request, UserDetails currentUser) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        boolean isAdmin = currentUser.getAuthorities()
                .contains(new SimpleGrantedAuthority("ROLE_ADMIN"));

        boolean isSelf = currentUser.getUsername().equals(user.getEmail());

        if (!isAdmin && !isSelf) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You do not have permission to update this user");
        }

        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        // Only admins can change roles
        if (request.getRole() != null && isAdmin) {
            user.setRole(request.getRole());
        }

        userRepository.save(user);
        log.info("Updated user id={} by {}", id, currentUser.getUsername());
        return UserResponse.from(user);
    }

    // ----------------------------------------------------------------
    // listUsers — admin only
    // ----------------------------------------------------------------

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public List<UserResponse> listUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .collect(Collectors.toList());
    }

    // ----------------------------------------------------------------
    // deactivateUser / reactivateUser — admin only
    // ----------------------------------------------------------------

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public UserResponse deactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        user.setEnabled(false);
        userRepository.save(user);
        log.info("Deactivated user id={}", id);
        return UserResponse.from(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public UserResponse reactivateUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        user.setEnabled(true);
        userRepository.save(user);
        log.info("Reactivated user id={}", id);
        return UserResponse.from(user);
    }    

}