package ru.itmo.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "domain")
@Getter
@Setter
@NoArgsConstructor
public class Domain {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "domain_part", nullable = false)
    private String domainPart;

    @Column(name = "domain_version")
    private Long domainVersion;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Domain parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Domain> children = new ArrayList<>();

    @OneToMany(mappedBy = "domain", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DnsRecord> dnsRecords = new ArrayList<>();
}
