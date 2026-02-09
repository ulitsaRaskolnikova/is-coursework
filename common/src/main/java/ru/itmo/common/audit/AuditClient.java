package ru.itmo.common.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

/**
 * HTTP-клиент для отправки событий в audit-service.
 * Все вызовы асинхронные (fire-and-forget) — ошибки логируются, но не пробрасываются.
 */
public class AuditClient {

    private static final Logger log = LoggerFactory.getLogger(AuditClient.class);

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public AuditClient(RestTemplate restTemplate, String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    public void log(String description, UUID userId) {
        try {
            String url = baseUrl + "/audit/events";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = new java.util.HashMap<>();
            body.put("description", description);
            if (userId != null) {
                body.put("userId", userId.toString());
            }

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);
            restTemplate.postForEntity(url, entity, Void.class);
        } catch (Exception e) {
            log.warn("Failed to send audit event: {}", e.getMessage());
        }
    }

    public void log(String description) {
        log(description, null);
    }
}
