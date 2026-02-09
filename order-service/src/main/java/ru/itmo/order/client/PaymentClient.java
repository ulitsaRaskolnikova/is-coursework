package ru.itmo.order.client;

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
public class PaymentClient {

    private static final String PAYMENTS_PATH = "/payments";

    private final RestTemplate restTemplate;
    private final PaymentClientProperties properties;
    private final ObjectMapper objectMapper;

    public PaymentClient(RestTemplate restTemplate, PaymentClientProperties properties, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public PaymentCreateResponse createPayment(PaymentCreateRequest request, String jwtToken) {
        String url = UriComponentsBuilder.fromHttpUrl(properties.getBaseUrl())
                .path(PAYMENTS_PATH)
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + jwtToken);

        try {
            HttpEntity<PaymentCreateRequest> entity = new HttpEntity<>(request, headers);
            return restTemplate.exchange(url, HttpMethod.POST, entity, PaymentCreateResponse.class).getBody();
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            String errorMessage = parseErrorFromBody(e.getResponseBodyAsString());
            throw new PaymentClientException("Failed to create payment: " + errorMessage, e);
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
