package ru.itmo.payment.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class YooKassaClient {

    private static final Logger log = LoggerFactory.getLogger(YooKassaClient.class);
    private static final String BASE_URL = "https://api.yookassa.ru/v3";
    private static final String PAYMENTS_PATH = "/payments";

    private final RestTemplate restTemplate;
    private final YooKassaClientProperties properties;
    private final ObjectMapper objectMapper;

    public YooKassaClient(RestTemplate restTemplate, YooKassaClientProperties properties, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    public YooKassaCreateResponse createPayment(String orderId, int amount, String currency, String description, String returnUrl) {
        String url = UriComponentsBuilder.fromHttpUrl(BASE_URL)
                .path(PAYMENTS_PATH)
                .toUriString();

        if (properties.getShopId() == null || properties.getShopId().isBlank()) {
            throw new YooKassaClientException("Shop ID is required", null);
        }
        if (properties.getSecretKey() == null || properties.getSecretKey().isBlank()) {
            throw new YooKassaClientException("Secret key is required", null);
        }

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("amount", Map.of(
                "value", String.format("%.2f", amount / 100.0),
                "currency", currency != null ? currency : "RUB"
        ));
        requestBody.put("confirmation", Map.of(
                "type", "redirect",
                "return_url", returnUrl != null ? returnUrl : properties.getReturnUrl()
        ));
        requestBody.put("capture", true);
        requestBody.put("description", description);
        requestBody.put("metadata", Map.of("orderId", orderId));

        HttpHeaders headers = createAuthHeaders();
        headers.set("Idempotence-Key", orderId);

        try {
            log.info("YooKassa createPayment request url={} body={}", url, requestBody);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            String responseBody = restTemplate.postForObject(url, entity, String.class);
            log.info("YooKassa createPayment response body={}", responseBody);
            return parseCreateResponse(responseBody);
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.warn("YooKassa createPayment error status={} body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new YooKassaClientException("Failed to create payment: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.warn("YooKassa createPayment error: {}", e.getMessage());
            throw new YooKassaClientException("Failed to create payment", e);
        }
    }

    public YooKassaPaymentInfo getPaymentInfo(String paymentId) {
        String url = UriComponentsBuilder.fromHttpUrl(BASE_URL)
                .path(PAYMENTS_PATH)
                .path("/")
                .path(paymentId)
                .toUriString();

        HttpHeaders headers = createAuthHeaders();

        try {
            log.info("YooKassa getPaymentInfo request url={}", url);
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            String responseBody = restTemplate.exchange(url, HttpMethod.GET, entity, String.class).getBody();
            log.info("YooKassa getPaymentInfo response body={}", responseBody);
            return parsePaymentInfo(responseBody);
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            log.warn("YooKassa getPaymentInfo error status={} body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new YooKassaClientException("Failed to get payment info: " + e.getResponseBodyAsString(), e);
        } catch (Exception e) {
            log.warn("YooKassa getPaymentInfo error: {}", e.getMessage());
            throw new YooKassaClientException("Failed to get payment info", e);
        }
    }

    private HttpHeaders createAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String auth = properties.getShopId() + ":" + properties.getSecretKey();
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
        headers.set("Authorization", "Basic " + encodedAuth);
        return headers;
    }

    private YooKassaCreateResponse parseCreateResponse(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return new YooKassaCreateResponse(null, null);
        }
        try {
            JsonNode node = objectMapper.readTree(responseBody);
            String paymentId = node.path("id").asText(null);
            JsonNode confirmation = node.path("confirmation");
            String confirmationUrl = confirmation.path("confirmation_url").asText(null);
            return new YooKassaCreateResponse(paymentId, confirmationUrl);
        } catch (Exception e) {
            log.warn("Failed to parse YooKassa create response: {}", e.getMessage());
            return new YooKassaCreateResponse(null, null);
        }
    }

    private YooKassaPaymentInfo parsePaymentInfo(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            log.warn("YooKassa payment info response is null or blank");
            return new YooKassaPaymentInfo(null);
        }
        try {
            JsonNode node = objectMapper.readTree(responseBody);
            String status = node.path("status").asText(null);
            log.info("Parsed YooKassa payment status: {}", status);
            return new YooKassaPaymentInfo(status);
        } catch (Exception e) {
            log.warn("Failed to parse YooKassa payment info: {}, response body: {}", e.getMessage(), responseBody);
            return new YooKassaPaymentInfo(null);
        }
    }

    public static class YooKassaCreateResponse {
        private final String paymentId;
        private final String confirmationUrl;

        public YooKassaCreateResponse(String paymentId, String confirmationUrl) {
            this.paymentId = paymentId;
            this.confirmationUrl = confirmationUrl;
        }

        public String getPaymentId() {
            return paymentId;
        }

        public String getConfirmationUrl() {
            return confirmationUrl;
        }
    }

    public static class YooKassaPaymentInfo {
        private final String status;

        public YooKassaPaymentInfo(String status) {
            this.status = status;
        }

        public String getStatus() {
            return status;
        }
    }
}
