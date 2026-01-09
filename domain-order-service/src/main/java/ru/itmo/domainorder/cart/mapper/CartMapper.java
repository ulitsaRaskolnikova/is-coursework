package ru.itmo.domainorder.cart.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import ru.itmo.domainorder.cart.entity.Cart;
import ru.itmo.domainorder.cart.entity.CartItem;
import ru.itmo.domainorder.cart.dto.AddCartItemRequest;
import ru.itmo.domainorder.cart.dto.CartItemResponse;
import ru.itmo.domainorder.cart.dto.CartResponse;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CartMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "cartId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    CartItem toEntity(AddCartItemRequest request);

    CartItemResponse toResponse(CartItem item);

    List<CartItemResponse> toResponseList(List<CartItem> items);

    @Mapping(target = "items", source = "items")
    CartResponse toResponse(Cart cart, List<CartItemResponse> items);
}
