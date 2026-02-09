package ru.itmo.admin.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import ru.itmo.admin.generated.api.ReportApi;
import ru.itmo.admin.service.ReportService;

@RestController
@RequiredArgsConstructor
@org.springframework.web.bind.annotation.RequestMapping("${openapi.adminService.base-path:/admin}")
public class ReportApiController implements ReportApi {

    private final ReportService reportService;
    private final HttpServletRequest httpServletRequest;

    @Override
    public ResponseEntity<Resource> downloadReport() {
        String authHeader = httpServletRequest.getHeader("Authorization");
        String jwtToken = authHeader != null && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
        if (jwtToken == null) {
            return ResponseEntity.status(401).build();
        }

        byte[] reportBytes = reportService.generateReport(jwtToken);
        ByteArrayResource resource = new ByteArrayResource(reportBytes);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"report.md\"")
                .contentType(MediaType.parseMediaType("text/markdown"))
                .contentLength(reportBytes.length)
                .body(resource);
    }
}
