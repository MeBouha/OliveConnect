package tn.oliveconnect.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import tn.oliveconnect.common.web.PageRequests;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import tn.oliveconnect.common.dto.PageResponse;
import tn.oliveconnect.dto.AlertRequest;
import tn.oliveconnect.dto.AlertStatusRequest;
import tn.oliveconnect.entity.Alert;
import tn.oliveconnect.entity.AlertStatus;
import tn.oliveconnect.service.AlertService;

@RestController
@RequestMapping("/api/alerts")
@Tag(name = "Alerts")
public class AlertController {

  private final AlertService alertService;

  public AlertController(AlertService alertService) {
    this.alertService = alertService;
  }

  @GetMapping
  public PageResponse<Alert> findAll(
      @RequestParam(required = false) AlertStatus status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Pageable pageable = PageRequests.of(page, size);
    Page<Alert> result = alertService.findAll(status, pageable);
    return PageResponse.of(result);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasAnyRole('FARMER','TEAM_LEADER','COLLECTION_MANAGER','ADMIN')")
  public Alert create(@Valid @RequestBody AlertRequest request) {
    return alertService.create(request);
  }

  @PatchMapping("/{id}/status")
  @PreAuthorize("hasAnyRole('COLLECTION_MANAGER','TEAM_LEADER','ADMIN')")
  public Alert updateStatus(@PathVariable String id, @Valid @RequestBody AlertStatusRequest request) {
    return alertService.updateStatus(id, request.getStatus());
  }
}
