package ru.itmo.domain.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.domain.client.ExdnsClient;
import ru.itmo.domain.entity.DnsRecord;
import ru.itmo.domain.entity.Domain;
import ru.itmo.domain.exception.DnsRecordNameMismatchException;
import ru.itmo.domain.exception.DnsRecordNotFoundException;
import ru.itmo.domain.exception.L2DomainNotFoundException;
import ru.itmo.domain.generated.model.DnsRecordResponse;
import ru.itmo.domain.repository.DomainRepository;
import ru.itmo.domain.repository.DnsRecordRepository;
import ru.itmo.domain.service.DnsRecordService;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DnsRecordServiceImpl implements DnsRecordService {

    private static final Map<String, String> RECORD_TYPE_TO_RESPONSE_TYPE = Map.of(
            "DnsRecordA", "DnsRecordResponseA",
            "DnsRecordAAAA", "DnsRecordResponseAAAA",
            "DnsRecordCNAME", "DnsRecordResponseCNAME",
            "DnsRecordMX", "DnsRecordResponseMX",
            "DnsRecordNS", "DnsRecordResponseNS",
            "DnsRecordSOA", "DnsRecordResponseSOA",
            "DnsRecordTXT", "DnsRecordResponseTXT"
    );

    private final DomainRepository domainRepository;
    private final DnsRecordRepository dnsRecordRepository;
    private final ExdnsClient exdnsClient;
    private final ObjectMapper objectMapper;

    public DnsRecordServiceImpl(DomainRepository domainRepository,
                                DnsRecordRepository dnsRecordRepository,
                                ExdnsClient exdnsClient,
                                ObjectMapper objectMapper) {
        this.domainRepository = domainRepository;
        this.dnsRecordRepository = dnsRecordRepository;
        this.exdnsClient = exdnsClient;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public DnsRecordResponse create(String l2Domain, ru.itmo.domain.generated.model.DnsRecord dnsRecord) {
        String name = l2Domain == null ? null : l2Domain.trim();
        JsonNode tree = objectMapper.valueToTree(dnsRecord);
        String bodyName = tree.has("name") && !tree.get("name").isNull() ? tree.get("name").asText().trim() : null;
        if (bodyName == null || !name.equals(bodyName)) {
            throw new DnsRecordNameMismatchException(name, bodyName);
        }
        Domain domain = domainRepository.findByDomainPartAndParentIsNull(name)
                .orElseThrow(() -> new L2DomainNotFoundException(name));

        String recordData = tree.toString();

        DnsRecord entity = new DnsRecord();
        entity.setRecordData(recordData);
        entity.setDomain(domain);
        entity = dnsRecordRepository.save(entity);

        syncZoneToExdns(name);

        return toDnsRecordResponse(recordData, entity.getId());
    }

    @Override
    @Transactional
    public DnsRecordResponse createL3Domain(String l3Domain, ru.itmo.domain.generated.model.DnsRecord dnsRecord) {
        String l3Name = l3Domain == null ? null : l3Domain.trim();
        int firstDot = l3Name == null ? -1 : l3Name.indexOf('.');
        if (firstDot <= 0 || firstDot == l3Name.length() - 1) {
            throw new DnsRecordNameMismatchException(l3Name, l3Name);
        }
        String l3Part = l3Name.substring(0, firstDot);
        String l2Name = l3Name.substring(firstDot + 1);

        JsonNode tree = objectMapper.valueToTree(dnsRecord);
        String bodyName = tree.has("name") && !tree.get("name").isNull() ? tree.get("name").asText().trim() : null;
        if (bodyName == null || !l3Name.equals(bodyName)) {
            throw new DnsRecordNameMismatchException(l3Name, bodyName);
        }

        Domain l2 = domainRepository.findByDomainPartAndParentIsNull(l2Name)
                .orElseThrow(() -> new L2DomainNotFoundException(l2Name));

        Domain l3 = domainRepository.findByParentIdAndDomainPart(l2.getId(), l3Part)
                .orElseGet(() -> {
                    Domain child = new Domain();
                    child.setDomainPart(l3Part);
                    child.setParent(l2);
                    child.setDomainVersion(1L);
                    return domainRepository.save(child);
                });

        String recordData = tree.toString();
        DnsRecord entity = new DnsRecord();
        entity.setRecordData(recordData);
        entity.setDomain(l3);
        entity = dnsRecordRepository.save(entity);

        syncZoneToExdns(l2Name);
        return toDnsRecordResponse(recordData, entity.getId());
    }

    @Override
    public List<String> getFreeL3Domains(String name) {
        String l3Part = name == null ? null : name.trim();
        if (l3Part == null || l3Part.isBlank()) {
            return List.of();
        }
        return domainRepository.findAllByParentIsNull().stream()
                .filter(l2 -> !domainRepository.existsByParentIdAndDomainPart(l2.getId(), l3Part))
                .map(l2 -> l3Part + "." + l2.getDomainPart())
                .collect(Collectors.toList());
    }

    @Override
    public List<DnsRecordResponse> getDnsRecords(String l2Domain) {
        String name = l2Domain == null ? null : l2Domain.trim();
        Domain domain = domainRepository.findByDomainPartAndParentIsNull(name)
                .orElseThrow(() -> new L2DomainNotFoundException(name));
        return dnsRecordRepository.findByDomainId(domain.getId()).stream()
                .filter(rec -> rec.getRecordData() != null && !rec.getRecordData().isBlank())
                .map(rec -> toDnsRecordResponse(rec.getRecordData(), rec.getId()))
                .collect(Collectors.toList());
    }

    @Override
    public DnsRecordResponse getById(Long id) {
        DnsRecord entity = dnsRecordRepository.findById(id)
                .orElseThrow(() -> new DnsRecordNotFoundException(id));
        String recordData = entity.getRecordData();
        if (recordData == null || recordData.isBlank()) {
            throw new DnsRecordNotFoundException(id);
        }
        return toDnsRecordResponse(recordData, entity.getId());
    }

    @Override
    @Transactional
    public DnsRecordResponse updateById(Long id, ru.itmo.domain.generated.model.DnsRecord dnsRecord) {
        DnsRecord entity = dnsRecordRepository.findById(id)
                .orElseThrow(() -> new DnsRecordNotFoundException(id));
        Domain domain = entity.getDomain();
        if (domain == null) {
            throw new DnsRecordNotFoundException(id);
        }
        String expectedName = getFullDomainName(domain);
        JsonNode tree = objectMapper.valueToTree(dnsRecord);
        String bodyName = tree.has("name") && !tree.get("name").isNull() ? tree.get("name").asText().trim() : null;
        if (bodyName == null || !expectedName.equals(bodyName)) {
            throw new DnsRecordNameMismatchException(expectedName, bodyName);
        }
        String recordData = tree.toString();
        entity.setRecordData(recordData);
        entity = dnsRecordRepository.save(entity);
        syncZoneToExdns(getL2DomainName(domain));
        return toDnsRecordResponse(recordData, entity.getId());
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        DnsRecord entity = dnsRecordRepository.findById(id)
                .orElseThrow(() -> new DnsRecordNotFoundException(id));
        Domain domain = entity.getDomain();
        if (domain == null) {
            throw new DnsRecordNotFoundException(id);
        }
        String l2DomainName = getL2DomainName(domain);
        dnsRecordRepository.delete(entity);
        syncZoneToExdns(l2DomainName);
    }

    @Override
    @Transactional
    public void syncZoneToExdns(String l2Domain) {
        String name = l2Domain == null ? null : l2Domain.trim();
        Domain domain = domainRepository.findByDomainPartAndParentIsNull(name)
                .orElseThrow(() -> new L2DomainNotFoundException(name));

        long currentVersion;
        try {
            JsonNode existingZone = exdnsClient.getZoneBody(name);
            currentVersion = existingZone != null && existingZone.has("version")
                    ? existingZone.get("version").asLong()
                    : 1L;
        } catch (ru.itmo.domain.client.ExdnsClientException e) {
            currentVersion = domain.getDomainVersion() == null ? 1L : domain.getDomainVersion();
        }

        List<Long> zoneDomainIds = new ArrayList<>();
        zoneDomainIds.add(domain.getId());
        zoneDomainIds.addAll(domainRepository.findByParentId(domain.getId()).stream()
                .map(Domain::getId)
                .collect(Collectors.toList()));
        List<DnsRecord> records = dnsRecordRepository.findByDomainIdIn(zoneDomainIds);
        ArrayNode recordsArray = objectMapper.createArrayNode();
        for (DnsRecord rec : records) {
            if (rec.getRecordData() != null && !rec.getRecordData().isBlank()) {
                try {
                    JsonNode node = objectMapper.readTree(rec.getRecordData());
                    recordsArray.add(node);
                } catch (Exception ignored) {
                }
            }
        }

        ObjectNode zoneBody = objectMapper.createObjectNode();
        zoneBody.put("name", domain.getDomainPart());
        zoneBody.put("version", currentVersion);
        zoneBody.set("records", recordsArray);

        exdnsClient.replaceZone(name, zoneBody);

        domain.setDomainVersion(currentVersion + 1);
        domainRepository.save(domain);
    }

    private static String getL2DomainName(Domain domain) {
        Domain root = domain;
        while (root.getParent() != null) {
            root = root.getParent();
        }
        return root.getDomainPart();
    }

    /** Full DNS name for the domain: L2 = domainPart, L3 = domainPart + "." + L2 name, etc. */
    private static String getFullDomainName(Domain domain) {
        if (domain.getParent() == null) {
            return domain.getDomainPart();
        }
        return domain.getDomainPart() + "." + getL2DomainName(domain);
    }

    private DnsRecordResponse toDnsRecordResponse(String recordData, Long id) {
        try {
            JsonNode node = objectMapper.readTree(recordData);
            ObjectNode obj = (ObjectNode) node;
            obj.put("id", id);
            String typeName = node.has("type") ? node.get("type").asText() : null;
            if (typeName != null && RECORD_TYPE_TO_RESPONSE_TYPE.containsKey(typeName)) {
                obj.put("type", RECORD_TYPE_TO_RESPONSE_TYPE.get(typeName));
            }
            return objectMapper.treeToValue(node, DnsRecordResponse.class);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
