package ru.itmo.auth.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.samstevens.totp.code.*;
import dev.samstevens.totp.exceptions.QrGenerationException;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.itmo.auth.dto.Enable2FAWithSecretRequest;
import ru.itmo.auth.dto.TwoFactorSetupResponse;
import ru.itmo.auth.entity.AuthFactor;
import ru.itmo.auth.entity.User;
import ru.itmo.auth.exception.InvalidCredentialsException;
import ru.itmo.auth.exception.UserNotFoundException;
import ru.itmo.auth.repository.AuthFactorRepository;
import ru.itmo.auth.repository.UserRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TwoFactorService {

    private final UserRepository userRepository;
    private final AuthFactorRepository authFactorRepository;
    private final ObjectMapper objectMapper;

    @Value("${app.name:Domain Registrar}")
    private String appName;

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final QrGenerator qrGenerator = new ZxingPngQrGenerator();
    private final TimeProvider timeProvider = new SystemTimeProvider();
    private final CodeGenerator codeGenerator = new DefaultCodeGenerator();
    private final CodeVerifier codeVerifier = new DefaultCodeVerifier(codeGenerator, timeProvider);

    @Transactional(readOnly = true)
    public TwoFactorSetupResponse generateSetup(UUID userId) {
        log.info("Generating 2FA setup for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (!user.getEmailVerified()) {
            throw new IllegalStateException("Email must be verified before enabling 2FA");
        }

        if (authFactorRepository.existsByUserIdAndKind(userId, AuthFactor.AuthFactorKind.TOTP)) {
            throw new IllegalStateException("2FA is already enabled for this user");
        }

        String secret = secretGenerator.generate();

        QrData qrData = new QrData.Builder()
                .label(user.getEmail())
                .secret(secret)
                .issuer(appName)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();

        try {
            byte[] qrCodeImage = qrGenerator.generate(qrData);
            String qrCodeUrl = "data:image/png;base64," + java.util.Base64.getEncoder().encodeToString(qrCodeImage);

            String manualEntryKey = formatSecretForManualEntry(secret);

            TwoFactorSetupResponse response = new TwoFactorSetupResponse();
            response.setSecret(secret);
            response.setQrCodeUrl(qrCodeUrl);
            response.setManualEntryKey(manualEntryKey);

            return response;
        } catch (QrGenerationException e) {
            log.error("Failed to generate QR code", e);
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    @Transactional
    public void enable2FA(UUID userId, String secret, Enable2FAWithSecretRequest request) {
        log.info("Enabling 2FA for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        if (!user.getEmailVerified()) {
            throw new IllegalStateException("Email must be verified before enabling 2FA");
        }

        if (!secret.equals(request.getSecret())) {
            throw new InvalidCredentialsException("Invalid secret");
        }

        if (!verifyCode(secret, request.getCode())) {
            throw new InvalidCredentialsException("Invalid TOTP code");
        }

        if (authFactorRepository.existsByUserIdAndKind(userId, AuthFactor.AuthFactorKind.TOTP)) {
            throw new IllegalStateException("2FA is already enabled for this user");
        }

        Map<String, String> publicData = new HashMap<>();
        publicData.put("secret", secret);

        try {
            String publicDataJson = objectMapper.writeValueAsString(publicData);

            AuthFactor authFactor = new AuthFactor();
            authFactor.setUserId(userId);
            authFactor.setKind(AuthFactor.AuthFactorKind.TOTP);
            authFactor.setPublicData(publicDataJson);

            authFactorRepository.save(authFactor);
            log.info("2FA enabled for user: {}", userId);
        } catch (Exception e) {
            log.error("Failed to save auth factor", e);
            throw new RuntimeException("Failed to enable 2FA", e);
        }
    }

    @Transactional
    public void disable2FA(UUID userId) {
        log.info("Disabling 2FA for user: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        authFactorRepository.deleteByUserIdAndKind(userId, AuthFactor.AuthFactorKind.TOTP);
        log.info("2FA disabled for user: {}", userId);
    }

    @Transactional(readOnly = true)
    public boolean is2FAEnabled(UUID userId) {
        return authFactorRepository.existsByUserIdAndKind(userId, AuthFactor.AuthFactorKind.TOTP);
    }

    @Transactional(readOnly = true)
    public boolean verify2FA(UUID userId, String code) {
        log.info("Verifying 2FA code for user: {}", userId);

        AuthFactor authFactor = authFactorRepository.findByUserIdAndKind(userId, AuthFactor.AuthFactorKind.TOTP)
                .orElseThrow(() -> new IllegalStateException("2FA is not enabled for this user"));

        try {
            Map<String, String> publicData = objectMapper.readValue(authFactor.getPublicData(), Map.class);
            String secret = publicData.get("secret");

            return verifyCode(secret, code);
        } catch (Exception e) {
            log.error("Failed to verify 2FA code", e);
            return false;
        }
    }

    private boolean verifyCode(String secret, String code) {
        return codeVerifier.isValidCode(secret, code);
    }

    private String formatSecretForManualEntry(String secret) {
        StringBuilder formatted = new StringBuilder();
        for (int i = 0; i < secret.length(); i += 4) {
            if (i > 0) {
                formatted.append(" ");
            }
            formatted.append(secret.substring(i, Math.min(i + 4, secret.length())));
        }
        return formatted.toString();
    }
}
