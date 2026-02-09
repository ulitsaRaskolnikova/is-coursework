package ru.itmo.payment.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.itmo.payment.service.PaymentService;

@RestController
@RequestMapping("/payments/webhook")
@RequiredArgsConstructor
public class YooKassaWebhookController {

    private static final Logger log = LoggerFactory.getLogger(YooKassaWebhookController.class);

    private final PaymentService paymentService;
    private final ObjectMapper objectMapper;

    @PostMapping
    public ResponseEntity<Void> handleWebhook(@RequestBody String payload) {
        try {
            log.info("Received YooKassa webhook: {}", payload);
            JsonNode node = objectMapper.readTree(payload);
            JsonNode event = node.path("event");
            String eventType = event.path("type").asText(null);
            JsonNode object = node.path("object");

            if ("payment.succeeded".equals(eventType) || "payment.canceled".equals(eventType)) {
                String yooKassaPaymentId = object.path("id").asText(null);
                String yooKassaStatus = object.path("status").asText(null);
                if (yooKassaPaymentId != null && !yooKassaPaymentId.isBlank() && yooKassaStatus != null) {
                    paymentService.updatePaymentStatusFromWebhook(yooKassaPaymentId, yooKassaStatus);
                }
            }

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error processing YooKassa webhook", e);
            return ResponseEntity.ok().build();
        }
    }
}
