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
public class DomainServiceClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public DomainServiceClient(RestTemplate restTemplate,
                               @Value("${services.domain.url}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    public List<Map<String, Object>> getExpiringDomains(int days, String jwtToken) {
        try {
            String url = baseUrl + "/domains/userDomains/expiring?days=" + days;

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(jwtToken);

            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url, HttpMethod.GET, new HttpEntity<>(headers),
                    new ParameterizedTypeReference<>() {});

            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Failed to get expiring domains (days={}): {}", days, e.getMessage());
            return Collections.emptyList();
        }
    }

    public long deleteExpiredDomains(String jwtToken) {
        try {
            String url = baseUrl + "/domains/userDomains/expired";

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(jwtToken);

            ResponseEntity<Long> response = restTemplate.exchange(
                    url, HttpMethod.DELETE, new HttpEntity<>(headers), Long.class);

            return response.getBody() != null ? response.getBody() : 0;
        } catch (Exception e) {
            log.warn("Failed to delete expired domains: {}", e.getMessage());
            return 0;
        }
    }
}
