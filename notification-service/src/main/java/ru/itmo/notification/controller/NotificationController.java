package ru.itmo.notification.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.itmo.common.dto.ApiResponse;
import ru.itmo.common.notification.SendNotificationRequest;
import ru.itmo.notification.service.NotificationService;
import ru.itmo.notification.util.SecurityUtil;

import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<Void>> sendNotification(
            @Valid @RequestBody SendNotificationRequest request) {
        UUID userId = SecurityUtil.getCurrentUserId();
        String userEmail = SecurityUtil.getCurrentUserEmail();
        
        if (userId == null || userEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(new ru.itmo.common.dto.ApiError("UNAUTHORIZED", "User not authenticated")));
        }
        
        notificationService.sendNotification(request, userEmail);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success(null));
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("Notification Service is running"));
    }
}
