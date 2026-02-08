package ru.itmo.domain.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.domain.client.ExdnsClient;
import ru.itmo.domain.entity.Domain;
import ru.itmo.domain.exception.DuplicateL2DomainException;
import ru.itmo.domain.generated.model.L2Domain;
import ru.itmo.domain.repository.DomainRepository;
import ru.itmo.domain.service.L2DomainService;

@Service
public class L2DomainServiceImpl implements L2DomainService {

    private final DomainRepository domainRepository;
    private final ExdnsClient exdnsClient;
    private final ObjectMapper objectMapper;

    public L2DomainServiceImpl(DomainRepository domainRepository, ExdnsClient exdnsClient, ObjectMapper objectMapper) {
        this.domainRepository = domainRepository;
        this.exdnsClient = exdnsClient;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public L2Domain create(L2Domain l2Domain) {
        String name = l2Domain.getName() == null ? null : l2Domain.getName().trim();
        if (domainRepository.existsByDomainPartAndParentIsNull(name)) {
            throw new DuplicateL2DomainException(name);
        }
        Domain entity = new Domain();
        entity.setDomainPart(name);
        entity.setParent(null);
        entity.setDomainVersion(1L);
        entity = domainRepository.save(entity);

        ObjectNode zoneBody = objectMapper.createObjectNode();
        zoneBody.put("name", entity.getDomainPart());
        zoneBody.put("version", 1);
        zoneBody.set("records", objectMapper.createArrayNode());
        exdnsClient.createZone(entity.getDomainPart(), zoneBody);

        return new L2Domain().name(entity.getDomainPart());
    }
}
