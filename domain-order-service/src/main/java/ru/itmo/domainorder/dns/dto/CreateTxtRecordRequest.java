package ru.itmo.domainorder.dns.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateTxtRecordRequest {
    @NotNull(message = "Domain ID is required")
    private UUID domainId;

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Text value is required")
    private String textValue;

    @NotNull(message = "TTL is required")
    private Integer ttl;
}
