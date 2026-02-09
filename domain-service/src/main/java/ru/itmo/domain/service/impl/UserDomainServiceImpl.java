package ru.itmo.domain.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.common.audit.AuditClient;
import ru.itmo.domain.client.NotificationClient;
import ru.itmo.domain.dto.UserDomainDetailedResponse;
import ru.itmo.domain.entity.Domain;
import ru.itmo.domain.exception.ForbiddenException;
import ru.itmo.domain.exception.L2DomainNotFoundException;
import ru.itmo.domain.generated.model.CreateUserDomainsRequest;
import ru.itmo.domain.generated.model.DomainPeriod;
import ru.itmo.domain.generated.model.RenewUserDomainsRequest;
import ru.itmo.domain.repository.DomainRepository;
import ru.itmo.domain.service.UserDomainService;
import ru.itmo.domain.util.SecurityUtil;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class UserDomainServiceImpl implements UserDomainService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private final DomainRepository domainRepository;
    private final AuditClient auditClient;
    private final NotificationClient notificationClient;

    public UserDomainServiceImpl(DomainRepository domainRepository, AuditClient auditClient, NotificationClient notificationClient) {
        this.domainRepository = domainRepository;
        this.auditClient = auditClient;
        this.notificationClient = notificationClient;
    }

    @Override
    public List<String> getUserDomains() {
        UUID userId = SecurityUtil.getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User ID not found in security context");
        }

        List<Domain> l3Domains = domainRepository.findByUserIdAndParentIsNotNull(userId);
        List<String> result = new ArrayList<>();

        for (Domain l3Domain : l3Domains) {
            Domain l2Domain = l3Domain.getParent();
            if (l2Domain != null) {
                String fullDomainName = l3Domain.getDomainPart() + "." + l2Domain.getDomainPart();
                result.add(fullDomainName);
            }
        }

        return result;
    }

    @Override
    public List<UserDomainDetailedResponse> getUserDomainsDetailed() {
        UUID userId = SecurityUtil.getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User ID not found in security context");
        }

        List<Domain> l3Domains = domainRepository.findByUserIdAndParentIsNotNull(userId);
        List<UserDomainDetailedResponse> result = new ArrayList<>();

        for (Domain l3Domain : l3Domains) {
            Domain l2Domain = l3Domain.getParent();
            if (l2Domain != null) {
                String fqdn = l3Domain.getDomainPart() + "." + l2Domain.getDomainPart();
                result.add(new UserDomainDetailedResponse(
                        l3Domain.getId(),
                        fqdn,
                        l2Domain.getDomainPart(),
                        l3Domain.getActivatedAt() != null ? l3Domain.getActivatedAt().toString() : null,
                        l3Domain.getFinishedAt() != null ? l3Domain.getFinishedAt().toString() : null
                ));
            }
        }

        return result;
    }

    @Override
    @Transactional
    public List<String> createUserDomains(CreateUserDomainsRequest request) {
        UUID userId = SecurityUtil.getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User ID not found in security context");
        }

        DomainPeriod period = request.getPeriod();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime finishedAt = calculateFinishedAt(now, period);

        List<String> createdDomains = new ArrayList<>();

        for (String l3Domain : request.getL3Domains()) {
            String l3Name = l3Domain == null ? null : l3Domain.trim();
            if (l3Name == null || l3Name.isBlank()) {
                continue;
            }

            int firstDot = l3Name.indexOf('.');
            if (firstDot <= 0 || firstDot == l3Name.length() - 1) {
                continue;
            }

            String l3Part = l3Name.substring(0, firstDot);
            String l2Name = l3Name.substring(firstDot + 1);

            Domain l2 = domainRepository.findByDomainPartAndParentIsNull(l2Name)
                    .orElseThrow(() -> new L2DomainNotFoundException(l2Name));

            Domain l3 = domainRepository.findByParentIdAndDomainPart(l2.getId(), l3Part)
                    .orElseGet(() -> {
                        Domain child = new Domain();
                        child.setDomainPart(l3Part);
                        child.setParent(l2);
                        child.setDomainVersion(1L);
                        child.setUserId(userId);
                        child.setActivatedAt(now);
                        child.setFinishedAt(finishedAt);
                        return domainRepository.save(child);
                    });

            if (l3.getUserId() == null) {
                l3.setUserId(userId);
                l3.setActivatedAt(now);
                l3.setFinishedAt(finishedAt);
                domainRepository.save(l3);
            }

            createdDomains.add(l3Name);
        }

        auditClient.log("Created " + createdDomains.size() + " domains (period=" + period + "): " + String.join(", ", createdDomains), userId);

        if (!createdDomains.isEmpty()) {
            notificationClient.sendDomainsActivated(userId, createdDomains, finishedAt.format(DATE_FMT));
        }

        return createdDomains;
    }

    @Override
    @Transactional
    public List<String> renewUserDomains(RenewUserDomainsRequest request) {
        UUID userId = SecurityUtil.getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User ID not found in security context");
        }

        DomainPeriod period = request.getPeriod();
        List<String> renewedDomains = new ArrayList<>();
        java.util.LinkedHashMap<String, String> domainsWithExpiry = new java.util.LinkedHashMap<>();

        for (String l3Domain : request.getL3Domains()) {
            String l3Name = l3Domain == null ? null : l3Domain.trim();
            if (l3Name == null || l3Name.isBlank()) {
                continue;
            }

            int firstDot = l3Name.indexOf('.');
            if (firstDot <= 0 || firstDot == l3Name.length() - 1) {
                continue;
            }

            String l3Part = l3Name.substring(0, firstDot);
            String l2Name = l3Name.substring(firstDot + 1);

            Domain l2 = domainRepository.findByDomainPartAndParentIsNull(l2Name)
                    .orElseThrow(() -> new L2DomainNotFoundException(l2Name));

            Domain l3 = domainRepository.findByParentIdAndDomainPart(l2.getId(), l3Part)
                    .orElseThrow(() -> new IllegalArgumentException("Domain not found: " + l3Name));

            if (!SecurityUtil.isAdmin()) {
                if (l3.getUserId() == null || !l3.getUserId().equals(userId)) {
                    throw new ForbiddenException("You can only renew your own domains");
                }
            }

            LocalDateTime baseDate = l3.getFinishedAt();
            if (baseDate == null || baseDate.isBefore(LocalDateTime.now())) {
                baseDate = LocalDateTime.now();
            }
            LocalDateTime newFinishedAt = calculateFinishedAt(baseDate, period);
            l3.setFinishedAt(newFinishedAt);
            domainRepository.save(l3);

            renewedDomains.add(l3Name);
            domainsWithExpiry.put(l3Name, newFinishedAt.format(DATE_FMT));
        }

        auditClient.log("Renewed " + renewedDomains.size() + " domains (period=" + period + "): " + String.join(", ", renewedDomains), userId);

        if (!domainsWithExpiry.isEmpty()) {
            notificationClient.sendDomainsRenewed(userId, domainsWithExpiry);
        }

        return renewedDomains;
    }

    @Override
    @Transactional
    public long deleteExpiredDomains() {
        List<Domain> expired = domainRepository.findByParentIsNotNullAndFinishedAtBefore(LocalDateTime.now());
        long count = expired.size();
        domainRepository.deleteAll(expired);
        auditClient.log("Deleted " + count + " expired domains");
        return count;
    }

    private LocalDateTime calculateFinishedAt(LocalDateTime from, DomainPeriod period) {
        return switch (period) {
            case MONTH -> from.plusMonths(1);
            case YEAR -> from.plusYears(1);
        };
    }
}
