package ru.itmo.order.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

@Component
public class DomainClient {

    private static final String USER_DOMAINS_PATH = "/domains/userDomains";
    private static final String RENEW_DOMAINS_PATH = "/domains/userDomains/renew";

    private final RestTemplate restTemplate;
    private final DomainClientProperties properties;
    private final ObjectMapper objectMapper;

    public DomainClient(RestTemplate restTemplate, DomainClientProperties properties, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public List<String> createUserDomains(List<String> l3Domains, String period, String jwtToken) {
        String url = UriComponentsBuilder.fromHttpUrl(properties.getBaseUrl())
                .path(USER_DOMAINS_PATH)
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + jwtToken);

        Map<String, Object> body = Map.of(
                "l3Domains", l3Domains,
                "period", period
        );

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            List<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<List<String>>() {}
            ).getBody();
            return response != null ? response : List.of();
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            String errorMessage = parseErrorFromBody(e.getResponseBodyAsString());
            throw new DomainClientException("Failed to create user domains: " + errorMessage, e);
        }
    }

    public List<String> renewUserDomains(List<String> l3Domains, String period, String jwtToken) {
        String url = UriComponentsBuilder.fromHttpUrl(properties.getBaseUrl())
                .path(RENEW_DOMAINS_PATH)
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + jwtToken);

        Map<String, Object> body = Map.of(
                "l3Domains", l3Domains,
                "period", period
        );

        try {
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            List<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    new ParameterizedTypeReference<List<String>>() {}
            ).getBody();
            return response != null ? response : List.of();
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            String errorMessage = parseErrorFromBody(e.getResponseBodyAsString());
            throw new DomainClientException("Failed to renew user domains: " + errorMessage, e);
        }
    }

    private String parseErrorFromBody(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "Unknown error";
        }
        try {
            var node = objectMapper.readTree(responseBody);
            if (node != null && node.isArray() && node.size() > 0) {
                return node.get(0).asText();
            }
            if (node != null && node.has("message")) {
                return node.get("message").asText();
            }
        } catch (Exception ignored) {
        }
        return responseBody;
    }
}
