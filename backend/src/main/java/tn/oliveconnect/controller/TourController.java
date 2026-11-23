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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import tn.oliveconnect.common.dto.PageResponse;
import tn.oliveconnect.dto.TourProgressRequest;
import tn.oliveconnect.dto.TourRequest;
import tn.oliveconnect.entity.Tour;
import tn.oliveconnect.entity.TourStatus;
import tn.oliveconnect.service.TourService;

@RestController
@RequestMapping("/api/tours")
@Tag(name = "Tours")
public class TourController {

  private final TourService tourService;

  public TourController(TourService tourService) {
    this.tourService = tourService;
  }

  @GetMapping
  public PageResponse<Tour> findAll(
      @RequestParam(required = false) Instant from,
      @RequestParam(required = false) Instant to,
      @RequestParam(required = false) TourStatus status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<Tour> result = tourService.findAll(from, to, status, pageable);
    return PageResponse.of(result);
  }

  @GetMapping("/{id}")
  public Tour findById(@PathVariable String id) {
    return tourService.findById(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasAnyRole('COLLECTION_MANAGER','ADMIN')")
  public Tour create(@Valid @RequestBody TourRequest request) {
    return tourService.create(request);
  }

  @PatchMapping("/{id}/progress")
  @PreAuthorize("hasAnyRole('TEAM_LEADER','ADMIN')")
  public Tour updateProgress(@PathVariable String id, @Valid @RequestBody TourProgressRequest request) {
    return tourService.updateProgress(id, request);
  }

  @PostMapping("/{id}/cancel")
  @PreAuthorize("hasAnyRole('COLLECTION_MANAGER','ADMIN')")
  @Operation(summary = "Cancel a tour and release its harvests")
  public Tour cancel(@PathVariable String id) {
    return tourService.cancel(id);
  }
}
