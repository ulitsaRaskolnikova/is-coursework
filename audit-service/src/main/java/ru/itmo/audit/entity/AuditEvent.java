package ru.itmo.audit.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_event")
@Getter
@Setter
@NoArgsConstructor
public class AuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "description", nullable = false)
    private String description;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "event_time", nullable = false)
    private LocalDateTime eventTime;

    @PrePersist
    protected void onCreate() {
        if (eventTime == null) {
            eventTime = LocalDateTime.now();
        }
    }
}
