package ru.itmo.domainorder.domain.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import ru.itmo.domainorder.domain.entity.Domain;
import ru.itmo.domainorder.domain.dto.CreateDomainRequest;
import ru.itmo.domainorder.domain.dto.DomainResponse;
import ru.itmo.domainorder.domain.dto.UpdateDomainRequest;
import ru.itmo.domainorder.zone.entity.Zone;

@Mapper(componentModel = "spring")
public interface DomainMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "zone2Id", source = "request.zoneId")
    @Mapping(target = "activatedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Domain toEntity(CreateDomainRequest request);

    @Mapping(target = "id", source = "domain.id")
    @Mapping(target = "fqdn", source = "domain.fqdn")
    @Mapping(target = "zoneId", source = "domain.zone2Id")
    @Mapping(target = "zoneName", source = "zone.name")
    @Mapping(target = "activatedAt", source = "domain.activatedAt")
    @Mapping(target = "expiresAt", source = "domain.expiresAt")
    @Mapping(target = "createdAt", source = "domain.createdAt")
    @Mapping(target = "updatedAt", source = "domain.updatedAt")
    DomainResponse toResponse(Domain domain, Zone zone);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "fqdn", ignore = true)
    @Mapping(target = "zone2Id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(@MappingTarget Domain domain, UpdateDomainRequest request);
}
