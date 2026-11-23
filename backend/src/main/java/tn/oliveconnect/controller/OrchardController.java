package tn.oliveconnect.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
import tn.oliveconnect.common.exception.BadRequestException;
import tn.oliveconnect.dto.OrchardMapView;
import tn.oliveconnect.dto.OrchardRequest;
import tn.oliveconnect.entity.Orchard;
import tn.oliveconnect.service.OrchardService;

@RestController
@RequestMapping("/api/orchards")
@Tag(name = "Orchards")
public class OrchardController {

  private final OrchardService orchardService;

  public OrchardController(OrchardService orchardService) {
    this.orchardService = orchardService;
  }

  @GetMapping("/map")
  @Operation(summary = "Public map markers inside a bounding box")
  public List<OrchardMapView> map(
      @RequestParam(defaultValue = "10.0,34.2,11.5,35.1") String bbox) {
    String[] parts = bbox.split(",");
    if (parts.length != 4) {
      throw new BadRequestException("bbox must be minLng,minLat,maxLng,maxLat");
    }
    try {
      return orchardService.map(Double.parseDouble(parts[0]), Double.parseDouble(parts[1]),
          Double.parseDouble(parts[2]), Double.parseDouble(parts[3]));
    } catch (NumberFormatException exception) {
      throw new BadRequestException("bbox values must be numbers");
    }
  }

  @GetMapping
  @PreAuthorize("hasAnyRole('FARMER','COLLECTION_MANAGER','TEAM_LEADER','LOGISTICS_MANAGER','PRESS_MANAGER','ADMIN')")
  public PageResponse<Orchard> findAll(
      @RequestParam(required = false) String farmerId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Pageable pageable = PageRequest.of(page, size);
    Page<Orchard> result = orchardService.findAll(farmerId, pageable);
    return PageResponse.of(result);
  }

  @GetMapping("/{id}")
  @PreAuthorize("hasAnyRole('FARMER','COLLECTION_MANAGER','TEAM_LEADER','LOGISTICS_MANAGER','PRESS_MANAGER','ADMIN')")
  public Orchard findById(@PathVariable String id) {
    return orchardService.findById(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasAnyRole('FARMER','ADMIN')")
  public Orchard create(@Valid @RequestBody OrchardRequest request) {
    return orchardService.create(request);
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAnyRole('FARMER','ADMIN')")
  public Orchard update(@PathVariable String id, @Valid @RequestBody OrchardRequest request) {
    return orchardService.update(id, request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @PreAuthorize("hasAnyRole('FARMER','ADMIN')")
  public void delete(@PathVariable String id) {
    orchardService.delete(id);
  }
}
