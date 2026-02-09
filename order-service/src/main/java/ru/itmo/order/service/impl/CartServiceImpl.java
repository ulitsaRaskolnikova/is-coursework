package ru.itmo.order.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.common.audit.AuditClient;
import ru.itmo.order.client.DomainClient;
import ru.itmo.order.entity.Cart;
import ru.itmo.order.generated.model.CartResponse;
import ru.itmo.order.repository.CartRepository;
import ru.itmo.order.service.CartService;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final DomainClient domainClient;
    private final AuditClient auditClient;

    @Value("${domain.monthly-price:200}")
    private int monthlyPrice;

    @Value("${domain.yearly-discount:0.7}")
    private double yearlyDiscount;

    public CartServiceImpl(CartRepository cartRepository, DomainClient domainClient, AuditClient auditClient) {
        this.cartRepository = cartRepository;
        this.domainClient = domainClient;
        this.auditClient = auditClient;
    }

    @Override
    @Transactional
    public void addToCart(UUID userId, String l3Domain) {
        String trimmed = l3Domain == null ? null : l3Domain.trim();
        if (trimmed == null || trimmed.isBlank()) {
            throw new IllegalArgumentException("l3Domain must not be blank");
        }
        if (cartRepository.existsByUserIdAndL3Domain(userId, trimmed)) {
            return;
        }
        Cart cart = new Cart();
        cart.setUserId(userId);
        cart.setL3Domain(trimmed);
        cartRepository.save(cart);
    }

    @Override
    @Transactional
    public List<String> checkout(UUID userId, String period, String jwtToken) {
        List<Cart> cartItems = cartRepository.findByUserIdOrderByL3Domain(userId);
        if (cartItems.isEmpty()) {
            throw new IllegalStateException("Cart is empty");
        }

        List<String> l3Domains = cartItems.stream()
                .map(Cart::getL3Domain)
                .collect(Collectors.toList());

        // Send domains to domain-service for registration with period
        List<String> createdDomains = domainClient.createUserDomains(l3Domains, period, jwtToken);

        // Clear cart after successful registration
        cartRepository.deleteByUserId(userId);

        auditClient.log("Checkout completed: " + createdDomains.size() + " domains (period=" + period + ")", userId);
        return createdDomains;
    }

    @Override
    public CartResponse getCartByUserId(UUID userId) {
        List<String> l3Domains = cartRepository.findByUserIdOrderByL3Domain(userId).stream()
                .map(Cart::getL3Domain)
                .collect(Collectors.toList());

        int domainCount = l3Domains.size();
        int totalMonthlyPrice = domainCount * monthlyPrice;
        int totalYearlyPrice = (int) Math.round(totalMonthlyPrice * 12 * yearlyDiscount);

        CartResponse response = new CartResponse();
        response.setTotalMonthlyPrice(totalMonthlyPrice);
        response.setTotalYearlyPrice(totalYearlyPrice);
        response.setL3Domains(l3Domains);
        return response;
    }
}
