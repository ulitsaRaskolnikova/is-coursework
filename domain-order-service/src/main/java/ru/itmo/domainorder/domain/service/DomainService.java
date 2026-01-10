package ru.itmo.domainorder.domain.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.domainorder.domain.dto.CreateDomainRequest;
import ru.itmo.domainorder.domain.dto.DomainResponse;
import ru.itmo.domainorder.domain.dto.DomainSearchResult;
import ru.itmo.domainorder.domain.dto.UpdateDomainRequest;
import ru.itmo.domainorder.domain.entity.Domain;
import ru.itmo.domainorder.domain.entity.DomainMember;
import ru.itmo.domainorder.domain.enumeration.DomainMemberRole;
import ru.itmo.domainorder.domain.exception.DomainAlreadyExistsException;
import ru.itmo.domainorder.domain.exception.DomainNotFoundException;
import ru.itmo.domainorder.domain.mapper.DomainMapper;
import ru.itmo.domainorder.domain.repository.DomainMemberRepository;
import ru.itmo.domainorder.domain.repository.DomainRepository;
import ru.itmo.domainorder.zone.entity.Zone;
import ru.itmo.domainorder.zone.exception.ZoneNotFoundException;
import ru.itmo.domainorder.zone.repository.ZoneRepository;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DomainService {
    private final DomainRepository domainRepository;
    private final ZoneRepository zoneRepository;
    private final DomainMapper domainMapper;
    private final DomainMemberRepository domainMemberRepository;

    @Transactional(readOnly = true)
    public Page<DomainResponse> getAllDomains(Pageable pageable) {
        return domainRepository.findAll(pageable)
                .map(domain -> {
                    Zone zone = zoneRepository.findById(domain.getZone2Id())
                            .orElseThrow(() -> new ZoneNotFoundException("Zone not found"));
                    return domainMapper.toResponse(domain, zone);
                });
    }

    @Transactional(readOnly = true)
    public DomainResponse getDomainById(UUID id) {
        Domain domain = domainRepository.findById(id)
                .orElseThrow(() -> new DomainNotFoundException("Domain not found with id: " + id));
        Zone zone = zoneRepository.findById(domain.getZone2Id())
                .orElseThrow(() -> new ZoneNotFoundException("Zone not found"));
        return domainMapper.toResponse(domain, zone);
    }

    @Transactional(readOnly = true)
    public DomainResponse getDomainByFqdn(String fqdn) {
        Domain domain = domainRepository.findByFqdn(fqdn)
                .orElseThrow(() -> new DomainNotFoundException("Domain not found with fqdn: " + fqdn));
        Zone zone = zoneRepository.findById(domain.getZone2Id())
                .orElseThrow(() -> new ZoneNotFoundException("Zone not found"));
        return domainMapper.toResponse(domain, zone);
    }

    @Transactional
    public DomainResponse createDomain(CreateDomainRequest request, UUID userId) {
        if (domainRepository.existsByFqdn(request.getFqdn())) {
            throw new DomainAlreadyExistsException("Domain already exists with fqdn: " + request.getFqdn());
        }

        Zone zone = zoneRepository.findById(request.getZoneId())
                .orElseThrow(() -> new ZoneNotFoundException("Zone not found with id: " + request.getZoneId()));

        Domain domain = domainMapper.toEntity(request);
        domain = domainRepository.save(domain);

        createDomainMember(domain.getId(), userId);

        return domainMapper.toResponse(domain, zone);
    }

    @Transactional
    public DomainResponse updateDomain(UUID id, UpdateDomainRequest request) {
        Domain domain = domainRepository.findById(id)
                .orElseThrow(() -> new DomainNotFoundException("Domain not found with id: " + id));
        
        domainMapper.updateEntity(domain, request);
        domain = domainRepository.save(domain);
        
        Zone zone = zoneRepository.findById(domain.getZone2Id())
                .orElseThrow(() -> new ZoneNotFoundException("Zone not found"));
        
        return domainMapper.toResponse(domain, zone);
    }

    @Transactional
    public void deleteDomain(UUID id) {
        Domain domain = domainRepository.findById(id)
                .orElseThrow(() -> new DomainNotFoundException("Domain not found with id: " + id));
        domainRepository.delete(domain);
    }

    @Transactional
    public DomainResponse activateDomain(UUID id) {
        Domain domain = domainRepository.findById(id)
                .orElseThrow(() -> new DomainNotFoundException("Domain not found with id: " + id));
        
        domain.setActivatedAt(java.time.LocalDateTime.now());
        domain = domainRepository.save(domain);
        
        Zone zone = zoneRepository.findById(domain.getZone2Id())
                .orElseThrow(() -> new ZoneNotFoundException("Zone not found"));
        
        return domainMapper.toResponse(domain, zone);
    }

    private void createDomainMember(UUID domainId, UUID userId) {
        if (!domainMemberRepository.existsByDomainIdAndUserId(domainId, userId)) {
            DomainMember member = new DomainMember();
            member.setDomainId(domainId);
            member.setUserId(userId);
            member.setRole(DomainMemberRole.OWNER);
            domainMemberRepository.save(member);
        }
    }

    @Transactional(readOnly = true)
    public List<DomainSearchResult> searchDomains(String query) {
        List<Zone> zones = zoneRepository.findAll();
        
        String pattern = query + ".%";
        Set<String> existingFqdns = new HashSet<>(domainRepository.findFqdnsByPattern(pattern));
        
        List<DomainSearchResult> results = new ArrayList<>();
        
        for (Zone zone : zones) {
            String fqdn = query + "." + zone.getName();
            boolean exists = existingFqdns.contains(fqdn);
            
            DomainSearchResult result = new DomainSearchResult();
            result.setFqdn(fqdn);
            result.setFree(!exists);
            result.setPrice(zone.getPrice());
            results.add(result);
        }
        
        return results;
    }
}
