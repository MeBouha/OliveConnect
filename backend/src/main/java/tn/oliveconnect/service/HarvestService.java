package tn.oliveconnect.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import tn.oliveconnect.common.exception.BadRequestException;
import tn.oliveconnect.common.exception.ConflictException;
import tn.oliveconnect.common.exception.ForbiddenException;
import tn.oliveconnect.common.exception.ResourceNotFoundException;
import tn.oliveconnect.dao.HarvestRepository;
import tn.oliveconnect.dao.OrchardRepository;
import tn.oliveconnect.dao.TourRepository;
import tn.oliveconnect.dto.HarvestRequest;
import tn.oliveconnect.dto.HarvestUpdateRequest;
import tn.oliveconnect.dto.TourAssignRequest;
import tn.oliveconnect.entity.Harvest;
import tn.oliveconnect.entity.HarvestStatus;
import tn.oliveconnect.entity.Orchard;
import tn.oliveconnect.entity.Role;
import tn.oliveconnect.entity.Tour;
import tn.oliveconnect.entity.TourStatus;
import tn.oliveconnect.mapper.DomainMapper;
import tn.oliveconnect.security.SecurityContextHelper;

@Service
public class HarvestService {

  private static final List<HarvestStatus> EDITABLE_STATUSES = List.of(
      HarvestStatus.REQUESTED, HarvestStatus.VALIDATED, HarvestStatus.PLANNED);

  private final HarvestRepository harvestRepository;
  private final OrchardRepository orchardRepository;
  private final TourRepository tourRepository;
  private final TourService tourService;
  private final NotificationService notificationService;
  private final MongoTemplate mongoTemplate;
  private final DomainMapper mapper;

  public HarvestService(HarvestRepository harvestRepository, OrchardRepository orchardRepository,
      TourRepository tourRepository, TourService tourService, NotificationService notificationService,
      MongoTemplate mongoTemplate, DomainMapper mapper) {
    this.harvestRepository = harvestRepository;
    this.orchardRepository = orchardRepository;
    this.tourRepository = tourRepository;
    this.tourService = tourService;
    this.notificationService = notificationService;
    this.mongoTemplate = mongoTemplate;
    this.mapper = mapper;
  }

  public Page<Harvest> findAll(HarvestStatus status, Instant from, Instant to, String orchardId,
      Pageable pageable) {
    List<Criteria> criteria = new ArrayList<>();
    if (status != null) {
      criteria.add(Criteria.where("status").is(status));
    }
    if (orchardId != null && !orchardId.isBlank()) {
      criteria.add(Criteria.where("orchardId").is(orchardId));
    }
    if (from != null && to != null) {
      criteria.add(new Criteria().orOperator(
          Criteria.where("plannedDate").gte(from).lte(to),
          Criteria.where("requestedDate").gte(from).lte(to)));
    }
    if (SecurityContextHelper.hasAnyRole(Role.FARMER)) {
      criteria.add(Criteria.where("farmerId").is(SecurityContextHelper.currentUserId()));
    }
    Query query = criteria.isEmpty() ? new Query() : new Query(new Criteria().andOperator(criteria));
    long total = mongoTemplate.count(query, Harvest.class);
    query.with(pageable);
    return new PageImpl<>(mongoTemplate.find(query, Harvest.class), pageable, total);
  }

  public Harvest findById(String id) {
    Harvest harvest = harvestRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Harvest", id));
    assertReadable(harvest);
    return harvest;
  }

  public Harvest create(HarvestRequest request) {
    Orchard orchard = orchardRepository.findById(request.getOrchardId())
        .orElseThrow(() -> new ResourceNotFoundException("Orchard", request.getOrchardId()));
    if (!orchard.getFarmerId().equals(SecurityContextHelper.currentUserId())
        && !SecurityContextHelper.isAdmin()) {
      throw new ForbiddenException("This orchard belongs to another farmer");
    }
    Harvest harvest = harvestRepository.save(mapper.toEntity(request, SecurityContextHelper.currentUserId()));
    notificationService.notifyRole(Role.COLLECTION_MANAGER, "Nouvelle demande de récolte",
        "Une récolte " + harvest.getType() + " a été demandée pour " + orchard.getName(), harvest.getId());
    return harvest;
  }

  public Harvest update(String id, HarvestUpdateRequest request) {
    Harvest harvest = findById(id);
    assertOwner(harvest);
    assertNotStarted(harvest);
    if (request.getType() != null) {
      harvest.setType(request.getType());
    }
    if (request.getRequestedDate() != null) {
      harvest.setRequestedDate(request.getRequestedDate());
    }
    if (request.getNotes() != null) {
      harvest.setNotes(request.getNotes());
    }
    return harvestRepository.save(harvest);
  }

  public Harvest cancel(String id) {
    Harvest harvest = findById(id);
    if (!SecurityContextHelper.hasAnyRole(Role.COLLECTION_MANAGER, Role.ADMIN)) {
      assertOwner(harvest);
    }
    assertNotStarted(harvest);
    harvest.setStatus(HarvestStatus.CANCELLED);
    Harvest saved = harvestRepository.save(harvest);
    notificationService.notifyUser(harvest.getFarmerId(), "Récolte annulée",
        "Votre demande de récolte a été annulée", harvest.getId());
    return saved;
  }

  public Tour assignTour(String harvestId, TourAssignRequest request) {
    Harvest harvest = findById(harvestId);
    if (!SecurityContextHelper.hasAnyRole(Role.COLLECTION_MANAGER, Role.ADMIN)) {
      throw new ForbiddenException("Only a collection manager can assign a tour");
    }
    return tourService.assignHarvest(harvest.getId(), request);
  }

  private void assertReadable(Harvest harvest) {
    if (SecurityContextHelper.hasAnyRole(Role.FARMER)) {
      assertOwner(harvest);
    }
  }

  private void assertOwner(Harvest harvest) {
    if (!harvest.getFarmerId().equals(SecurityContextHelper.currentUserId())
        && !SecurityContextHelper.isAdmin()) {
      throw new ForbiddenException("This harvest belongs to another farmer");
    }
  }

  private void assertNotStarted(Harvest harvest) {
    if (!EDITABLE_STATUSES.contains(harvest.getStatus())) {
      throw new ConflictException("Harvest can no longer be modified: status " + harvest.getStatus());
    }
    if (harvest.getTourId() != null) {
      Tour tour = tourRepository.findById(harvest.getTourId()).orElse(null);
      if (tour != null && tour.getStatus() != TourStatus.PLANNED) {
        throw new ConflictException("Tour has already started");
      }
    }
  }
}
