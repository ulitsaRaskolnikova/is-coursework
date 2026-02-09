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
import ru.itmo.domain.exception.DnsRecordNotFoundException;
import ru.itmo.domain.exception.L2DomainNotFoundException;
import ru.itmo.domain.generated.model.DnsRecordResponse;
import ru.itmo.domain.repository.DomainRepository;
import ru.itmo.domain.repository.DnsRecordRepository;
import ru.itmo.domain.service.DnsRecordService;

import java.util.List;
import java.util.Map;

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
        Domain domain = domainRepository.findByDomainPartAndParentIsNull(name)
                .orElseThrow(() -> new L2DomainNotFoundException(name));

        String recordData = objectMapper.valueToTree(dnsRecord).toString();

        DnsRecord entity = new DnsRecord();
        entity.setRecordData(recordData);
        entity.setDomain(domain);
        entity = dnsRecordRepository.save(entity);

        syncZoneToExdns(name);

        return toDnsRecordResponse(recordData, entity.getId());
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

        List<DnsRecord> records = dnsRecordRepository.findByDomainId(domain.getId());
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
