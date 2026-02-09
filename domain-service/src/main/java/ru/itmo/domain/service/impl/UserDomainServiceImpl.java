package ru.itmo.domain.service.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.domain.entity.Domain;
import ru.itmo.domain.exception.L2DomainNotFoundException;
import ru.itmo.domain.repository.DomainRepository;
import ru.itmo.domain.service.UserDomainService;
import ru.itmo.domain.util.SecurityUtil;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class UserDomainServiceImpl implements UserDomainService {

    private final DomainRepository domainRepository;

    public UserDomainServiceImpl(DomainRepository domainRepository) {
        this.domainRepository = domainRepository;
    }

    @Override
    @Transactional
    public List<String> createUserDomains(List<String> l3Domains) {
        UUID userId = SecurityUtil.getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("User ID not found in security context");
        }
        
        List<String> createdDomains = new ArrayList<>();
        
        for (String l3Domain : l3Domains) {
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
            
            // Create L3 domain if it doesn't exist
            Domain l3 = domainRepository.findByParentIdAndDomainPart(l2.getId(), l3Part)
                    .orElseGet(() -> {
                        Domain child = new Domain();
                        child.setDomainPart(l3Part);
                        child.setParent(l2);
                        child.setDomainVersion(1L);
                        child.setUserId(userId);
                        return domainRepository.save(child);
                    });
            
            // If domain already exists but doesn't have userId set, update it
            if (l3.getUserId() == null) {
                l3.setUserId(userId);
                domainRepository.save(l3);
            }
            
            createdDomains.add(l3Name);
        }
        
        return createdDomains;
    }
}
