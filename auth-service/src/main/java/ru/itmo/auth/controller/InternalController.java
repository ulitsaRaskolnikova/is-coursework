package ru.itmo.auth.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.itmo.auth.entity.User;
import ru.itmo.auth.repository.UserRepository;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Внутренние endpoints для межсервисного взаимодействия. Доступны только ADMIN.
 */
@RestController
@RequestMapping("/auth/internal")
@RequiredArgsConstructor
public class InternalController {

    private final UserRepository userRepository;

    /**
     * Возвращает маппинг userId → email для списка userId.
     */
    @PostMapping("/emails")
    public ResponseEntity<Map<String, String>> getEmailsByUserIds(@RequestBody List<String> userIds) {
        List<UUID> uuids = userIds.stream()
                .map(UUID::fromString)
                .collect(Collectors.toList());

        List<User> users = userRepository.findByIdIn(uuids);

        Map<String, String> result = users.stream()
                .collect(Collectors.toMap(
                        u -> u.getId().toString(),
                        User::getEmail
                ));

        return ResponseEntity.ok(result);
    }
}
