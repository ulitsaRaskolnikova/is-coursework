package ru.itmo.domainorder.dns.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateCaaRecordRequest {
    @NotNull(message = "Domain ID is required")
    private UUID domainId;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Flags are required")
    @Pattern(regexp = "^[0-9]$", message = "Flags must be a single digit (0-255)")
    private String flags;

    @NotBlank(message = "Tag is required")
    @Pattern(regexp = "^(issue|issuewild|iodef)$", message = "Tag must be one of: issue, issuewild, iodef")
    private String tag;

    @NotBlank(message = "Value is required")
    private String value;

    @NotNull(message = "TTL is required")
    private Integer ttl;
}
