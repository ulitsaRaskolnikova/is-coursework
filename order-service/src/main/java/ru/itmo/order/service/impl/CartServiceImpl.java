package ru.itmo.order.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.order.entity.Cart;
import ru.itmo.order.repository.CartRepository;
import ru.itmo.order.service.CartService;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;

    public CartServiceImpl(CartRepository cartRepository) {
        this.cartRepository = cartRepository;
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
    public List<String> getCartByUserId(UUID userId) {
        return cartRepository.findByUserIdOrderByL3Domain(userId).stream()
                .map(Cart::getL3Domain)
                .collect(Collectors.toList());
    }
}
