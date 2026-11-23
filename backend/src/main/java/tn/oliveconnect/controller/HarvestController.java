package tn.oliveconnect.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import tn.oliveconnect.common.dto.PageResponse;
import tn.oliveconnect.dto.HarvestRequest;
import tn.oliveconnect.dto.HarvestUpdateRequest;
import tn.oliveconnect.dto.TourAssignRequest;
import tn.oliveconnect.entity.Harvest;
import tn.oliveconnect.entity.HarvestStatus;
import tn.oliveconnect.entity.Tour;
import tn.oliveconnect.service.HarvestService;

@RestController
@RequestMapping("/api/harvests")
@Tag(name = "Harvests")
public class HarvestController {

  private final HarvestService harvestService;

  public HarvestController(HarvestService harvestService) {
    this.harvestService = harvestService;
  }

  @GetMapping
  public PageResponse<Harvest> findAll(
      @RequestParam(required = false) HarvestStatus status,
      @RequestParam(required = false) Instant from,
      @RequestParam(required = false) Instant to,
      @RequestParam(required = false) String orchardId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<Harvest> result = harvestService.findAll(status, from, to, orchardId, pageable);
    return PageResponse.of(result);
  }

  @GetMapping("/{id}")
  public Harvest findById(@PathVariable String id) {
    return harvestService.findById(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasAnyRole('FARMER','ADMIN')")
  public Harvest create(@Valid @RequestBody HarvestRequest request) {
    return harvestService.create(request);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('FARMER','ADMIN')")
  public Harvest update(@PathVariable String id, @Valid @RequestBody HarvestUpdateRequest request) {
    return harvestService.update(id, request);
  }

  @PostMapping("/{id}/cancel")
  @PreAuthorize("hasAnyRole('FARMER','COLLECTION_MANAGER','ADMIN')")
  public Harvest cancel(@PathVariable String id) {
    return harvestService.cancel(id);
  }

  @PostMapping("/{id}/assign-tour")
  @PreAuthorize("hasAnyRole('COLLECTION_MANAGER','ADMIN')")
  @Operation(summary = "Plan a tour for a requested harvest")
  public Tour assignTour(@PathVariable String id, @Valid @RequestBody TourAssignRequest request) {
    return harvestService.assignTour(id, request);
  }
}
