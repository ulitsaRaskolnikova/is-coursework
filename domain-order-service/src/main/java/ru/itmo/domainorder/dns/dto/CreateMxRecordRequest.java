package ru.itmo.domainorder.dns.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateMxRecordRequest {
    @NotNull(message = "Domain ID is required")
    private UUID domainId;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Mail exchange hostname is required")
    private String mailExchange;

    @NotNull(message = "Priority is required")
    @Min(value = 0, message = "Priority must be non-negative")
    private Integer priority;

    @NotNull(message = "TTL is required")
    private Integer ttl;
}
