package ru.itmo.domainorder.dns.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateARecordRequest {
    @NotNull(message = "Domain ID is required")
    private UUID domainId;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "IPv4 address is required")
    @Pattern(regexp = "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
            message = "Invalid IPv4 address format")
    private String ipv4Address;

    @NotNull(message = "TTL is required")
    private Integer ttl;
}
