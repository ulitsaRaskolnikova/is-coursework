package ru.itmo.domain.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class ExdnsClient {

    private static final String ZONES_PATH = "/zones/{name}";

    private final RestTemplate restTemplate;
    private final ExdnsClientProperties properties;
    private final ObjectMapper objectMapper;

    public ExdnsClient(RestTemplate restTemplate, ExdnsClientProperties properties, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public void createZone(String l2Domain, JsonNode body) {
        exchange(l2Domain, HttpMethod.POST, body);
    }

    public void getZone(String l2Domain) {
        exchange(l2Domain, HttpMethod.GET, null);
    }

    public void replaceZone(String l2Domain, JsonNode body) {
        exchange(l2Domain, HttpMethod.PUT, body);
    }

    public void deleteZone(String l2Domain) {
        exchange(l2Domain, HttpMethod.DELETE, null);
    }

    private void exchange(String l2Domain, HttpMethod method, JsonNode body) {
        String url = UriComponentsBuilder.fromHttpUrl(properties.getBaseUrl())
                .path(ZONES_PATH)
                .buildAndExpand(l2Domain)
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authentication", "Bearer " + properties.getApiToken());

        HttpEntity<JsonNode> entity = body != null
                ? new HttpEntity<>(body, headers)
                : new HttpEntity<>(headers);

        try {
            JsonNode responseBody = restTemplate.exchange(url, method, entity, JsonNode.class).getBody();
            failIfError(responseBody);
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            String errorMessage = parseErrorFromBody(e.getResponseBodyAsString());
            throw new ExdnsClientException(errorMessage, e);
        }
    }

    private void failIfError(JsonNode body) {
        if (body != null && body.has("error")) {
            throw new ExdnsClientException(body.get("error").asText());
        }
    }

    private String parseErrorFromBody(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "Unknown error";
        }
        try {
            JsonNode node = objectMapper.readTree(responseBody);
            if (node != null && node.has("error")) {
                return node.get("error").asText();
            }
        } catch (Exception ignored) {
        }
        return responseBody;
    }
}
