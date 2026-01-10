package ru.itmo.domainorder.dns.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateSrvRecordRequest {
    @NotNull(message = "Domain ID is required")
    private UUID domainId;

    @NotBlank(message = "Service name is required")
    private String serviceName;

    @NotBlank(message = "Target hostname is required")
    private String target;

    @NotNull(message = "Priority is required")
    @Min(value = 0, message = "Priority must be non-negative")
    private Integer priority;

    @NotNull(message = "Weight is required")
    @Min(value = 0, message = "Weight must be non-negative")
    @Max(value = 65535, message = "Weight must not exceed 65535")
    private Integer weight;

    @NotNull(message = "Port is required")
    @Min(value = 1, message = "Port must be positive")
    @Max(value = 65535, message = "Port must not exceed 65535")
    private Integer port;

    @NotNull(message = "TTL is required")
    private Integer ttl;
}
