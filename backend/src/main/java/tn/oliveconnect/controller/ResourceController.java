package tn.oliveconnect.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import tn.oliveconnect.common.web.PageRequests;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
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
import tn.oliveconnect.dto.ResourceRequest;
import tn.oliveconnect.dto.SupplyView;
import tn.oliveconnect.entity.Resource;
import tn.oliveconnect.entity.ResourceType;
import tn.oliveconnect.service.ResourceService;

@RestController
@RequestMapping("/api/resources")
@Tag(name = "Resources")
public class ResourceController {

  private final ResourceService resourceService;

  public ResourceController(ResourceService resourceService) {
    this.resourceService = resourceService;
  }

  @GetMapping("/availability")
  @Operation(summary = "Resources available between two dates")
  public List<Resource> availability(
      @RequestParam Instant from,
      @RequestParam Instant to,
      @RequestParam(required = false) ResourceType type) {
    return resourceService.availability(from, to, type);
  }

  @GetMapping("/supplies")
  public List<SupplyView> supplies() {
    return resourceService.supplies();
  }

  @GetMapping
  public PageResponse<Resource> findAll(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Pageable pageable = PageRequests.of(page, size);
    Page<Resource> result = resourceService.findAll(pageable);
    return PageResponse.of(result);
  }

  @GetMapping("/{id}")
  public Resource findById(@PathVariable String id) {
    return resourceService.findById(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasAnyRole('LOGISTICS_MANAGER','ADMIN')")
  public Resource create(@Valid @RequestBody ResourceRequest request) {
    return resourceService.create(request);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('LOGISTICS_MANAGER','ADMIN')")
  public Resource update(@PathVariable String id, @Valid @RequestBody ResourceRequest request) {
    return resourceService.update(id, request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("hasAnyRole('LOGISTICS_MANAGER','ADMIN')")
  public void delete(@PathVariable String id) {
    resourceService.delete(id);
  }
}
