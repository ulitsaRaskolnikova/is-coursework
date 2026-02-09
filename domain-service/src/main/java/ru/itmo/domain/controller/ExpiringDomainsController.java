package ru.itmo.domain.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import ru.itmo.domain.entity.Domain;
import ru.itmo.domain.repository.DomainRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("${openapi.openAPIDNS.base-path:/domains}")
@RequiredArgsConstructor
public class ExpiringDomainsController {

    private final DomainRepository domainRepository;

    /**
     * Возвращает L3-домены, у которых finished_at приходится на дату через `days` дней от сегодня.
     * Доступен только для ADMIN (scheduler использует admin JWT).
     */
    @GetMapping("/userDomains/expiring")
    public ResponseEntity<List<Map<String, Object>>> getExpiringDomains(@RequestParam int days) {
        LocalDate targetDate = LocalDate.now().plusDays(days);
        LocalDateTime start = targetDate.atStartOfDay();
        LocalDateTime end = targetDate.plusDays(1).atStartOfDay();

        List<Domain> domains = domainRepository.findByParentIsNotNullAndFinishedAtBetween(start, end);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Domain d : domains) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("userId", d.getUserId());
            entry.put("domainName", d.getDomainPart() + "." + d.getParent().getDomainPart());
            entry.put("finishedAt", d.getFinishedAt().toString());
            result.add(entry);
        }

        return ResponseEntity.ok(result);
    }
}
