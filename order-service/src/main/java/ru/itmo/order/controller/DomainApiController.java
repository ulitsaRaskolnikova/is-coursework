package ru.itmo.order.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RestController;
import ru.itmo.order.client.DomainClient;
import ru.itmo.order.generated.api.DomainApi;
import ru.itmo.order.generated.model.RenewDomainsRequest;

import java.util.List;
import java.util.UUID;

@RestController
@org.springframework.web.bind.annotation.RequestMapping("${openapi.orderService.base-path:/orders}")
public class DomainApiController implements DomainApi {

    private final DomainClient domainClient;
    private final HttpServletRequest httpServletRequest;

    public DomainApiController(DomainClient domainClient, HttpServletRequest httpServletRequest) {
        this.domainClient = domainClient;
        this.httpServletRequest = httpServletRequest;
    }

    @Override
    public ResponseEntity<List<String>> renewDomains(RenewDomainsRequest renewDomainsRequest) {
        Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UUID)) {
            return ResponseEntity.status(401).build();
        }

        String authHeader = httpServletRequest.getHeader("Authorization");
        String jwtToken = authHeader != null && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
        if (jwtToken == null) {
            return ResponseEntity.status(401).build();
        }

        String period = renewDomainsRequest.getPeriod().getValue();
        List<String> renewedDomains = domainClient.renewUserDomains(
                renewDomainsRequest.getL3Domains(), period, jwtToken);
        return ResponseEntity.ok(renewedDomains);
    }
}
