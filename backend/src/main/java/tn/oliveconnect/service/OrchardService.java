package tn.oliveconnect.service;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import tn.oliveconnect.common.exception.BadRequestException;
import tn.oliveconnect.common.exception.ConflictException;
import tn.oliveconnect.common.exception.ForbiddenException;
import tn.oliveconnect.common.exception.ResourceNotFoundException;
import tn.oliveconnect.dao.HarvestRepository;
import tn.oliveconnect.dao.OrchardRepository;
import tn.oliveconnect.dto.OrchardMapView;
import tn.oliveconnect.dto.OrchardRequest;
import tn.oliveconnect.entity.Orchard;
import tn.oliveconnect.entity.Role;
import tn.oliveconnect.mapper.DomainMapper;
import tn.oliveconnect.security.SecurityContextHelper;

@Service
public class OrchardService {

  private final OrchardRepository orchardRepository;
  private final HarvestRepository harvestRepository;
  private final DomainMapper mapper;

  public OrchardService(OrchardRepository orchardRepository, HarvestRepository harvestRepository,
      DomainMapper mapper) {
    this.orchardRepository = orchardRepository;
    this.harvestRepository = harvestRepository;
    this.mapper = mapper;
  }

  public Page<Orchard> findAll(String farmerIdFilter, Pageable pageable) {
    if (SecurityContextHelper.hasAnyRole(Role.FARMER)) {
      return orchardRepository.findByFarmerId(SecurityContextHelper.currentUserId(), pageable);
    }
    if (farmerIdFilter != null && !farmerIdFilter.isBlank()) {
      return orchardRepository.findByFarmerId(farmerIdFilter, pageable);
    }
    return orchardRepository.findAll(pageable);
  }

  public Orchard findById(String id) {
    Orchard orchard = orchardRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Orchard", id));
    assertReadable(orchard);
    return orchard;
  }

  public Orchard create(OrchardRequest request) {
    if (request.getAreaHa() <= 0) {
      throw new BadRequestException("areaHa must be positive");
    }
    return orchardRepository.save(mapper.toEntity(request, SecurityContextHelper.currentUserId()));
  }

  public Orchard update(String id, OrchardRequest request) {
    Orchard orchard = findById(id);
    assertOwner(orchard);
    orchard.setName(request.getName());
    orchard.setGeometry(request.getGeometry());
    orchard.setAreaHa(request.getAreaHa());
    orchard.setVariety(request.getVariety());
    if (request.getPlots() != null) {
      orchard.setPlots(new java.util.ArrayList<>(request.getPlots()));
    }
    return orchardRepository.save(orchard);
  }

  public void delete(String id) {
    Orchard orchard = findById(id);
    assertOwner(orchard);
    if (!harvestRepository.findByOrchardIdOrderByRequestedDateDesc(id).isEmpty()) {
      throw new ConflictException("Cannot delete an orchard with existing harvests");
    }
    orchardRepository.delete(orchard);
  }

  public List<OrchardMapView> map(double minLng, double minLat, double maxLng, double maxLat) {
    if (minLng > maxLng || minLat > maxLat) {
      throw new BadRequestException("Invalid bbox coordinates");
    }
    return orchardRepository.findWithinBBox(minLng, minLat, maxLng, maxLat);
  }

  private void assertReadable(Orchard orchard) {
    if (SecurityContextHelper.hasAnyRole(Role.FARMER)) {
      assertOwner(orchard);
    }
  }

  private void assertOwner(Orchard orchard) {
    if (!orchard.getFarmerId().equals(SecurityContextHelper.currentUserId())
        && !SecurityContextHelper.isAdmin()) {
      throw new ForbiddenException("This orchard belongs to another farmer");
    }
  }
}
