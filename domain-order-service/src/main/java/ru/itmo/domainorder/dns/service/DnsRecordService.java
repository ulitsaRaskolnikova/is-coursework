package ru.itmo.domainorder.dns.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.domainorder.dns.client.ExdnsClient;
import ru.itmo.domainorder.dns.dto.*;
import ru.itmo.domainorder.dns.entity.DnsRecord;
import ru.itmo.domainorder.dns.enumeration.DomainRecordType;
import ru.itmo.domainorder.dns.exception.DnsRecordNotFoundException;
import ru.itmo.domainorder.dns.exception.DomainAccessDeniedException;
import ru.itmo.domainorder.dns.repository.DnsRecordRepository;
import ru.itmo.domainorder.domain.entity.Domain;
import ru.itmo.domainorder.domain.repository.DomainMemberRepository;
import ru.itmo.domainorder.domain.repository.DomainRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DnsRecordService {

    private final DnsRecordRepository dnsRecordRepository;
    private final DomainRepository domainRepository;
    private final DomainMemberRepository domainMemberRepository;
    private final ExdnsClient exdnsClient;

    @Transactional(readOnly = true)
    public List<DnsRecordResponse> getRecordsByDomain(UUID domainId, UUID userId) {
        checkDomainAccess(domainId, userId);

        List<DnsRecord> records = dnsRecordRepository.findByDomainId(domainId);
        return records.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DnsRecordResponse getRecordById(UUID recordId, UUID userId) {
        DnsRecord record = dnsRecordRepository.findById(recordId)
                .orElseThrow(() -> new DnsRecordNotFoundException("DNS record not found"));

        checkDomainAccess(record.getDomainId(), userId);

        return toResponse(record);
    }

    @Transactional
    public DnsRecordResponse createARecord(CreateARecordRequest request, UUID userId) {
        checkDomainAccess(request.getDomainId(), userId);
        Domain domain = domainRepository.findById(request.getDomainId())
                .orElseThrow(() -> new RuntimeException("Domain not found"));

        DnsRecord record = new DnsRecord();
        record.setDomainId(request.getDomainId());
        record.setType(DomainRecordType.A);
        record.setName(request.getName());
        record.setValue(request.getIpv4Address());
        record.setTtl(request.getTtl());

        record = dnsRecordRepository.save(record);
        syncZoneToExdns(domain.getFqdn());

        return toResponse(record);
    }

    @Transactional
    public DnsRecordResponse createAaaaRecord(CreateAaaaRecordRequest request, UUID userId) {
        checkDomainAccess(request.getDomainId(), userId);
        Domain domain = domainRepository.findById(request.getDomainId())
                .orElseThrow(() -> new RuntimeException("Domain not found"));

        DnsRecord record = new DnsRecord();
        record.setDomainId(request.getDomainId());
        record.setType(DomainRecordType.AAAA);
        record.setName(request.getName());
        record.setValue(request.getIpv6Address());
        record.setTtl(request.getTtl());

        record = dnsRecordRepository.save(record);
        syncZoneToExdns(domain.getFqdn());

        return toResponse(record);
    }

    @Transactional
    public DnsRecordResponse createCnameRecord(CreateCnameRecordRequest request, UUID userId) {
        checkDomainAccess(request.getDomainId(), userId);
        Domain domain = domainRepository.findById(request.getDomainId())
                .orElseThrow(() -> new RuntimeException("Domain not found"));

        DnsRecord record = new DnsRecord();
        record.setDomainId(request.getDomainId());
        record.setType(DomainRecordType.CNAME);
        record.setName(request.getName());
        record.setValue(request.getCanonicalName());
        record.setTtl(request.getTtl());

        record = dnsRecordRepository.save(record);
        syncZoneToExdns(domain.getFqdn());

        return toResponse(record);
    }

    @Transactional
    public DnsRecordResponse createTxtRecord(CreateTxtRecordRequest request, UUID userId) {
        checkDomainAccess(request.getDomainId(), userId);
        Domain domain = domainRepository.findById(request.getDomainId())
                .orElseThrow(() -> new RuntimeException("Domain not found"));

        DnsRecord record = new DnsRecord();
        record.setDomainId(request.getDomainId());
        record.setType(DomainRecordType.TXT);
        record.setName(request.getName());
        record.setValue(request.getTextValue());
        record.setTtl(request.getTtl());

        record = dnsRecordRepository.save(record);
        syncZoneToExdns(domain.getFqdn());

        return toResponse(record);
    }

    @Transactional
    public DnsRecordResponse createMxRecord(CreateMxRecordRequest request, UUID userId) {
        checkDomainAccess(request.getDomainId(), userId);
        Domain domain = domainRepository.findById(request.getDomainId())
                .orElseThrow(() -> new RuntimeException("Domain not found"));

        DnsRecord record = new DnsRecord();
        record.setDomainId(request.getDomainId());
        record.setType(DomainRecordType.MX);
        record.setName(request.getName());
        record.setValue(request.getMailExchange());
        record.setTtl(request.getTtl());

        record = dnsRecordRepository.save(record);
        syncZoneToExdns(domain.getFqdn());

        DnsRecordResponse response = toResponse(record);
        response.setPriority(request.getPriority());
        return response;
    }

    @Transactional
    public DnsRecordResponse createSrvRecord(CreateSrvRecordRequest request, UUID userId) {
        checkDomainAccess(request.getDomainId(), userId);
        Domain domain = domainRepository.findById(request.getDomainId())
                .orElseThrow(() -> new RuntimeException("Domain not found"));

        String value = String.format("%d %d %d %s", 
                request.getPriority(), request.getWeight(), request.getPort(), request.getTarget());

        DnsRecord record = new DnsRecord();
        record.setDomainId(request.getDomainId());
        record.setType(DomainRecordType.SRV);
        record.setName(request.getServiceName());
        record.setValue(value);
        record.setTtl(request.getTtl());

        record = dnsRecordRepository.save(record);
        syncZoneToExdns(domain.getFqdn());

        DnsRecordResponse response = toResponse(record);
        response.setPriority(request.getPriority());
        response.setWeight(request.getWeight());
        response.setPort(request.getPort());
        return response;
    }

    @Transactional
    public DnsRecordResponse createCaaRecord(CreateCaaRecordRequest request, UUID userId) {
        checkDomainAccess(request.getDomainId(), userId);
        Domain domain = domainRepository.findById(request.getDomainId())
                .orElseThrow(() -> new RuntimeException("Domain not found"));

        String value = String.format("%s %s %s", 
                request.getFlags(), request.getTag(), request.getValue());

        DnsRecord record = new DnsRecord();
        record.setDomainId(request.getDomainId());
        record.setType(DomainRecordType.CAA);
        record.setName(request.getName());
        record.setValue(value);
        record.setTtl(request.getTtl());

        record = dnsRecordRepository.save(record);
        syncZoneToExdns(domain.getFqdn());

        DnsRecordResponse response = toResponse(record);
        response.setFlags(request.getFlags());
        response.setTag(request.getTag());
        return response;
    }

    @Transactional
    public DnsRecordResponse updateRecord(UUID recordId, UpdateDnsRecordRequest request, UUID userId) {
        DnsRecord record = dnsRecordRepository.findById(recordId)
                .orElseThrow(() -> new DnsRecordNotFoundException("DNS record not found"));

        checkDomainAccess(record.getDomainId(), userId);
        Domain domain = domainRepository.findById(record.getDomainId())
                .orElseThrow(() -> new RuntimeException("Domain not found"));

        record.setValue(request.getValue());
        record.setTtl(request.getTtl());

        if (request.getPriority() != null) {
            if (record.getType() == DomainRecordType.MX || record.getType() == DomainRecordType.SRV) {
                String currentValue = record.getValue();
                if (record.getType() == DomainRecordType.MX) {
                    String[] parts = currentValue.split(" ", 2);
                    if (parts.length == 2) {
                        record.setValue(request.getPriority() + " " + parts[1]);
                    }
                } else if (record.getType() == DomainRecordType.SRV) {
                    String[] parts = currentValue.split(" ", 4);
                    if (parts.length == 4) {
                        record.setValue(String.format("%d %s %s %s", 
                                request.getPriority(), parts[1], parts[2], parts[3]));
                    }
                }
            }
        }

        record = dnsRecordRepository.save(record);
        syncZoneToExdns(domain.getFqdn());

        DnsRecordResponse response = toResponse(record);
        if (request.getPriority() != null) {
            response.setPriority(request.getPriority());
        }
        if (request.getWeight() != null && record.getType() == DomainRecordType.SRV) {
            response.setWeight(request.getWeight());
        }
        if (request.getPort() != null && record.getType() == DomainRecordType.SRV) {
            response.setPort(request.getPort());
        }
        if (request.getFlags() != null && record.getType() == DomainRecordType.CAA) {
            response.setFlags(request.getFlags());
        }
        if (request.getTag() != null && record.getType() == DomainRecordType.CAA) {
            response.setTag(request.getTag());
        }
        return response;
    }

    @Transactional
    public void deleteRecord(UUID recordId, UUID userId) {
        DnsRecord record = dnsRecordRepository.findById(recordId)
                .orElseThrow(() -> new DnsRecordNotFoundException("DNS record not found"));

        checkDomainAccess(record.getDomainId(), userId);
        Domain domain = domainRepository.findById(record.getDomainId())
                .orElseThrow(() -> new RuntimeException("Domain not found"));

        dnsRecordRepository.delete(record);
        syncZoneToExdns(domain.getFqdn());
    }

    private void checkDomainAccess(UUID domainId, UUID userId) {
        if (!domainMemberRepository.existsByDomainIdAndUserId(domainId, userId)) {
            throw new DomainAccessDeniedException("Access denied to domain");
        }
    }

    private void syncZoneToExdns(String fqdn) {
        try {
            Domain domain = domainRepository.findByFqdn(fqdn)
                    .orElseThrow(() -> new RuntimeException("Domain not found"));

            List<DnsRecord> records = dnsRecordRepository.findByDomainId(domain.getId());

            ExdnsClient.ExdnsZone zone = new ExdnsClient.ExdnsZone();
            zone.setName(fqdn);
            zone.setVersion(1);

            ExdnsClient.ExdnsZone existingZone = exdnsClient.getZone(fqdn);
            if (existingZone != null && existingZone.getVersion() != null) {
                zone.setVersion(existingZone.getVersion() + 1);
            }

            List<ExdnsClient.ExdnsRecord> exdnsRecords = new ArrayList<>();
            for (DnsRecord record : records) {
                ExdnsClient.ExdnsRecord exdnsRecord = new ExdnsClient.ExdnsRecord();
                exdnsRecord.setName(record.getName());
                exdnsRecord.setType(record.getType().name());
                exdnsRecord.setTtl(record.getTtl());

                if (record.getType() == DomainRecordType.MX) {
                    String[] parts = record.getValue().split(" ", 2);
                    if (parts.length == 2) {
                        try {
                            Map<String, Object> mxData = new java.util.HashMap<>();
                            mxData.put("preference", Integer.parseInt(parts[0]));
                            mxData.put("exchange", parts[1]);
                            exdnsRecord.setData(mxData);
                        } catch (NumberFormatException e) {
                            exdnsRecord.setData(record.getValue());
                        }
                    } else {
                        exdnsRecord.setData(record.getValue());
                    }
                } else {
                    exdnsRecord.setData(record.getValue());
                }

                exdnsRecords.add(exdnsRecord);
            }

            zone.setRecords(exdnsRecords);
            exdnsClient.createOrUpdateZone(fqdn, zone);
        } catch (Exception e) {
            log.error("Failed to sync zone {} to exdns: {}", fqdn, e.getMessage(), e);
        }
    }

    private DnsRecordResponse toResponse(DnsRecord record) {
        DnsRecordResponse response = DnsRecordResponse.builder()
                .id(record.getId())
                .domainId(record.getDomainId())
                .recordType(record.getType().name())
                .name(record.getName())
                .value(record.getValue())
                .ttl(record.getTtl())
                .build();

        if (record.getType() == DomainRecordType.MX) {
            String[] parts = record.getValue().split(" ", 2);
            if (parts.length == 2) {
                try {
                    response.setPriority(Integer.parseInt(parts[0]));
                    response.setValue(parts[1]);
                } catch (NumberFormatException e) {
                }
            }
        } else if (record.getType() == DomainRecordType.SRV) {
            String[] parts = record.getValue().split(" ", 4);
            if (parts.length == 4) {
                try {
                    response.setPriority(Integer.parseInt(parts[0]));
                    response.setWeight(Integer.parseInt(parts[1]));
                    response.setPort(Integer.parseInt(parts[2]));
                    response.setValue(parts[3]);
                } catch (NumberFormatException e) {
                }
            }
        } else if (record.getType() == DomainRecordType.CAA) {
            String[] parts = record.getValue().split(" ", 3);
            if (parts.length == 3) {
                response.setFlags(parts[0]);
                response.setTag(parts[1]);
                response.setValue(parts[2]);
            }
        }

        return response;
    }
}
