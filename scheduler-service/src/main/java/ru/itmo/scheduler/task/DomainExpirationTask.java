package ru.itmo.scheduler.task;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import ru.itmo.scheduler.client.AuthServiceClient;
import ru.itmo.scheduler.client.DomainServiceClient;
import ru.itmo.scheduler.client.NotificationServiceClient;
import ru.itmo.scheduler.config.JwtTokenProvider;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class DomainExpirationTask {

    private final DomainServiceClient domainServiceClient;
    private final AuthServiceClient authServiceClient;
    private final NotificationServiceClient notificationServiceClient;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${scheduler.expiring-notifications.days-before:30,14,7,3,1}")
    private String daysBefore;

    @Scheduled(cron = "${scheduler.expiring-notifications.cron}")
    public void sendExpiringNotifications() {
        log.info("Starting expiring domain notifications check...");

        String token = jwtTokenProvider.generateSystemToken();
        int[] thresholds = parseThresholds(daysBefore);

        for (int days : thresholds) {
            processThreshold(days, token);
        }

        log.info("Expiring domain notifications check completed.");
    }

    @Scheduled(cron = "${scheduler.expired-cleanup.cron}")
    public void cleanupExpiredDomains() {
        log.info("Starting expired domain cleanup...");

        String token = jwtTokenProvider.generateSystemToken();
        long deleted = domainServiceClient.deleteExpiredDomains(token);

        log.info("Expired domain cleanup completed. Deleted: {} domains.", deleted);
    }

    private void processThreshold(int days, String token) {
        List<Map<String, Object>> expiringDomains = domainServiceClient.getExpiringDomains(days, token);

        if (expiringDomains.isEmpty()) {
            log.debug("No domains expiring in {} days.", days);
            return;
        }

        log.info("Found {} domains expiring in {} days.", expiringDomains.size(), days);

        Set<String> userIds = expiringDomains.stream()
                .map(d -> String.valueOf(d.get("userId")))
                .filter(id -> id != null && !id.equals("null"))
                .collect(Collectors.toSet());

        if (userIds.isEmpty()) {
            return;
        }

        Map<String, String> emailMap = authServiceClient.getEmailsByUserIds(new ArrayList<>(userIds), token);

        for (Map<String, Object> domain : expiringDomains) {
            String userId = String.valueOf(domain.get("userId"));
            String domainName = String.valueOf(domain.get("domainName"));
            String finishedAt = String.valueOf(domain.get("finishedAt"));
            String email = emailMap.get(userId);

            if (email == null) {
                log.warn("No email found for userId={}, skipping domain={}", userId, domainName);
                continue;
            }

            notificationServiceClient.sendExpiringNotification(
                    email,
                    UUID.fromString(userId),
                    domainName,
                    finishedAt,
                    days,
                    token
            );
        }
    }

    private int[] parseThresholds(String value) {
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .mapToInt(Integer::parseInt)
                .toArray();
    }
}
