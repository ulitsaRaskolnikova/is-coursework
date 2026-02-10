package ru.itmo.domain.service.impl;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.domain.entity.Domain;
import ru.itmo.domain.entity.DomainReservation;
import ru.itmo.domain.exception.ForbiddenException;
import ru.itmo.domain.repository.DomainRepository;
import ru.itmo.domain.repository.DomainReservationRepository;
import ru.itmo.domain.service.DomainReservationService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DomainReservationServiceImpl implements DomainReservationService {

    private static final Logger log = LoggerFactory.getLogger(DomainReservationServiceImpl.class);

    private final DomainReservationRepository reservationRepository;
    private final DomainRepository domainRepository;

    @Override
    @Transactional
    public List<String> reserveDomains(UUID paymentId, UUID userId, List<String> l3Domains, String period, int ttlMinutes) {
        List<String> reservedDomains = new ArrayList<>();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(ttlMinutes);

        for (String l3Domain : l3Domains) {
            String trimmed = l3Domain == null ? null : l3Domain.trim();
            if (trimmed == null || trimmed.isBlank()) {
                continue;
            }

            int firstDot = trimmed.indexOf('.');
            if (firstDot <= 0 || firstDot == trimmed.length() - 1) {
                continue;
            }

            String l3Part = trimmed.substring(0, firstDot);
            String l2Name = trimmed.substring(firstDot + 1);

            Domain l2 = domainRepository.findByDomainPartAndParentIsNull(l2Name)
                    .orElseThrow(() -> new IllegalArgumentException("L2 domain not found: " + l2Name));

            Domain existingL3 = domainRepository.findByParentIdAndDomainPart(l2.getId(), l3Part).orElse(null);
            if (existingL3 != null && existingL3.getUserId() != null && !existingL3.getUserId().equals(userId)) {
                throw new ForbiddenException("Domain " + trimmed + " is already owned by another user");
            }

            List<DomainReservation> activeReservations = reservationRepository.findActiveReservationsByL3Domain(trimmed, LocalDateTime.now());
            for (DomainReservation reservation : activeReservations) {
                if (!reservation.getUserId().equals(userId) && !reservation.getPaymentId().equals(paymentId)) {
                    throw new ForbiddenException("Domain " + trimmed + " is reserved by another user");
                }
            }

            DomainReservation existingReservation = reservationRepository.findByPaymentIdAndL3Domain(paymentId, trimmed).orElse(null);
            if (existingReservation != null) {
                existingReservation.setExpiresAt(expiresAt);
                reservationRepository.save(existingReservation);
            } else {
                DomainReservation reservation = new DomainReservation();
                reservation.setPaymentId(paymentId);
                reservation.setUserId(userId);
                reservation.setL3Domain(trimmed);
                reservation.setPeriod(period);
                reservation.setExpiresAt(expiresAt);
                reservation.setCreatedAt(LocalDateTime.now());
                reservationRepository.save(reservation);
            }

            reservedDomains.add(trimmed);
        }

        log.info("Reserved {} domains for payment {}", reservedDomains.size(), paymentId);
        return reservedDomains;
    }

    @Override
    @Transactional
    public void confirmReservation(UUID paymentId) {
        List<DomainReservation> reservations = reservationRepository.findByPaymentId(paymentId);
        if (reservations.isEmpty()) {
            log.warn("No reservations found for payment {}", paymentId);
            return;
        }

        reservationRepository.deleteByPaymentId(paymentId);
        log.info("Confirmed and deleted {} reservations for payment {}", reservations.size(), paymentId);
    }

    @Override
    @Transactional
    public void cancelReservation(UUID paymentId) {
        reservationRepository.deleteByPaymentId(paymentId);
        log.info("Cancelled reservations for payment {}", paymentId);
    }

    @Override
    @Transactional
    public long cleanupExpiredReservations() {
        LocalDateTime now = LocalDateTime.now();
        List<DomainReservation> expired = reservationRepository.findExpiredReservations(now);
        long count = expired.size();
        reservationRepository.deleteExpiredReservations(now);
        log.info("Cleaned up {} expired reservations", count);
        return count;
    }

    @Override
    public boolean isDomainReserved(String l3Domain) {
        if (l3Domain == null || l3Domain.isBlank()) {
            return false;
        }
        List<DomainReservation> activeReservations = reservationRepository.findActiveReservationsByL3Domain(l3Domain, LocalDateTime.now());
        return !activeReservations.isEmpty();
    }
}
