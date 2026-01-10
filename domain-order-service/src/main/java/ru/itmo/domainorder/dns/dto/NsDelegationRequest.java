package ru.itmo.domainorder.dns.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class NsDelegationRequest {
    @NotNull(message = "NS servers list is required")
    @NotEmpty(message = "At least one NS server is required")
    @Size(min = 1, max = 10, message = "NS servers list must contain between 1 and 10 servers")
    private List<@jakarta.validation.constraints.NotBlank(message = "NS server name cannot be blank") String> nsServers;
}
