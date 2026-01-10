package ru.itmo.domainorder.dns.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import ru.itmo.domainorder.dns.enumeration.DomainRecordType;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "dns_record")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DnsRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "domain_id", nullable = false)
    private UUID domainId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false, columnDefinition = "domain_record_type")
    private DomainRecordType type;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 1024)
    private String value;

    @Column(nullable = false)
    private Integer ttl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
