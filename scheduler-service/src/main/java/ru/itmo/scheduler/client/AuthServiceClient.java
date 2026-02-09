package ru.itmo.scheduler.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class AuthServiceClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public AuthServiceClient(RestTemplate restTemplate,
                             @Value("${services.auth.url}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    /**
     * Возвращает маппинг userId → email для списка userId.
     */
    public Map<String, String> getEmailsByUserIds(List<String> userIds, String jwtToken) {
        try {
            String url = baseUrl + "/auth/internal/emails";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(jwtToken);

            HttpEntity<List<String>> entity = new HttpEntity<>(userIds, headers);

            ResponseEntity<Map<String, String>> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity,
                    new ParameterizedTypeReference<>() {});

            return response.getBody() != null ? response.getBody() : Collections.emptyMap();
        } catch (Exception e) {
            log.warn("Failed to get emails from auth-service: {}", e.getMessage());
            return Collections.emptyMap();
        }
    }
}
