package ru.itmo.domainorder.dns.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateCnameRecordRequest {
    @NotNull(message = "Domain ID is required")
    private UUID domainId;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Canonical name is required")
    private String canonicalName;

    @NotNull(message = "TTL is required")
    private Integer ttl;
}
