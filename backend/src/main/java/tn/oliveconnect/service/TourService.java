package tn.oliveconnect.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
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
import tn.oliveconnect.dao.TourRepository;
import tn.oliveconnect.dao.UserRepository;
import tn.oliveconnect.dto.HarvestQuantityUpdate;
import tn.oliveconnect.dto.TourAssignRequest;
import tn.oliveconnect.dto.TourProgressRequest;
import tn.oliveconnect.dto.TourRequest;
import tn.oliveconnect.entity.Harvest;
import tn.oliveconnect.entity.HarvestStatus;
import tn.oliveconnect.entity.Role;
import tn.oliveconnect.entity.Tour;
import tn.oliveconnect.entity.TourStatus;
import tn.oliveconnect.entity.User;
import tn.oliveconnect.mapper.DomainMapper;
import tn.oliveconnect.security.SecurityContextHelper;

@Service
public class TourService {

  private final TourRepository tourRepository;
  private final HarvestRepository harvestRepository;
  private final UserRepository userRepository;
  private final ResourceService resourceService;
  private final NotificationService notificationService;
  private final MongoTemplate mongoTemplate;
  private final DomainMapper mapper;

  public TourService(TourRepository tourRepository, HarvestRepository harvestRepository,
      UserRepository userRepository, ResourceService resourceService,
      NotificationService notificationService, MongoTemplate mongoTemplate, DomainMapper mapper) {
    this.tourRepository = tourRepository;
    this.harvestRepository = harvestRepository;
    this.userRepository = userRepository;
    this.resourceService = resourceService;
    this.notificationService = notificationService;
    this.mongoTemplate = mongoTemplate;
    this.mapper = mapper;
  }

  public Page<Tour> findAll(Instant from, Instant to, TourStatus status, Pageable pageable) {
    List<Criteria> criteria = new ArrayList<>();
    if (from != null && to != null) {
      criteria.add(Criteria.where("plannedDate").gte(from).lte(to));
    }
    if (status != null) {
      criteria.add(Criteria.where("status").is(status));
    }
    Query query = criteria.isEmpty() ? new Query() : new Query(new Criteria().andOperator(criteria));
    long total = mongoTemplate.count(query, Tour.class);
    query.with(pageable);
    return new PageImpl<>(mongoTemplate.find(query, Tour.class), pageable, total);
  }

  public Tour findById(String id) {
    return tourRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Tour", id));
  }

  public Tour create(TourRequest request) {
    String code = resolveCode(request.getCode());
    validateTeamLeader(request.getTeamLeaderId());
    List<String> harvestIds = request.getHarvestIds() == null ? List.of() : request.getHarvestIds();
    if (harvestIds.size() > 30) {
      throw new BadRequestException("A tour can contain at most 30 harvests");
    }
    List<Harvest> harvests = harvestRepository.findAllById(harvestIds);
    if (harvests.size() != harvestIds.size()) {
      throw new ResourceNotFoundException("One or more harvests");
    }
    resourceService.assertAvailable(request.getResourceIds(), request.getPlannedDate(), null);

    Tour tour = mapper.toEntity(request, code);
    Tour saved = tourRepository.save(tour);
    linkHarvests(saved, harvests);
    notifyFarmers(harvests, "Tournée planifiée",
        "Votre récolte a été affectée à la tournée " + saved.getCode());
    return saved;
  }

  public Tour assignHarvest(String harvestId, TourAssignRequest request) {
    Harvest harvest = harvestRepository.findById(harvestId)
        .orElseThrow(() -> new ResourceNotFoundException("Harvest", harvestId));
    if (harvest.getStatus() != HarvestStatus.REQUESTED && harvest.getStatus() != HarvestStatus.VALIDATED) {
      throw new ConflictException("Only requested or validated harvests can be assigned to a tour");
    }
    validateTeamLeader(request.getTeamLeaderId());
    resourceService.assertAvailable(request.getResourceIds(), request.getPlannedDate(), null);

    Tour tour = mapper.toEntity(request, harvestId, resolveCode(request.getCode()));
    Tour saved = tourRepository.save(tour);
        harvest.setTourId(saved.getId());
    harvest.setStatus(HarvestStatus.PLANNED);
    harvest.setPlannedDate(request.getPlannedDate());
    harvestRepository.save(harvest);
    notificationService.notifyUser(harvest.getFarmerId(), "Tournée planifiée",
        "Votre récolte a été affectée à la tournée " + saved.getCode(), saved.getId());
    return saved;
  }

  public Tour updateProgress(String id, TourProgressRequest request) {
    Tour tour = findById(id);
    if (!SecurityContextHelper.isAdmin()
        && !tour.getTeamLeaderId().equals(SecurityContextHelper.currentUserId())) {
      throw new ForbiddenException("Only the assigned team leader can update this tour");
    }
    if (tour.getStatus() == TourStatus.COMPLETED || tour.getStatus() == TourStatus.CANCELLED) {
      throw new ConflictException("Tour is already closed");
    }

    tour.setStatus(request.getStatus());
    Tour saved = tourRepository.save(tour);

    List<Harvest> harvests = harvestRepository.findAllById(tour.getHarvestIds());
    if (request.getHarvestUpdates() != null && !request.getHarvestUpdates().isEmpty()) {
      for (HarvestQuantityUpdate update : request.getHarvestUpdates()) {
        if (!tour.getHarvestIds().contains(update.getHarvestId())) {
          throw new BadRequestException("Harvest is not part of this tour: " + update.getHarvestId());
        }
        Harvest harvest = harvests.stream()
            .filter(item -> item.getId().equals(update.getHarvestId()))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Harvest", update.getHarvestId()));
        harvest.setQuantityKg(update.getQuantityKg());
        if (update.getActualHarvestDate() != null) {
          harvest.setActualHarvestDate(update.getActualHarvestDate());
        }
      }
    }
    for (Harvest harvest : harvests) {
      if (request.getStatus() == TourStatus.IN_PROGRESS) {
        harvest.setStatus(HarvestStatus.IN_PROGRESS);
        if (harvest.getActualHarvestDate() == null) {
          harvest.setActualHarvestDate(Instant.now());
        }
      } else if (request.getStatus() == TourStatus.COMPLETED) {
        harvest.setStatus(HarvestStatus.COMPLETED);
        if (harvest.getActualHarvestDate() == null) {
          harvest.setActualHarvestDate(Instant.now());
        }
      }
    }
    harvestRepository.saveAll(harvests);
    return saved;
  }

  public Tour cancel(String id) {
    Tour tour = findById(id);
    if (tour.getStatus() == TourStatus.COMPLETED) {
      throw new ConflictException("Completed tour cannot be cancelled");
    }
    tour.setStatus(TourStatus.CANCELLED);
    Tour saved = tourRepository.save(tour);
    List<Harvest> harvests = harvestRepository.findAllById(tour.getHarvestIds());
    for (Harvest harvest : harvests) {
      harvest.setTourId(null);
      harvest.setStatus(HarvestStatus.REQUESTED);
      harvest.setPlannedDate(null);
    }
    harvestRepository.saveAll(harvests);
    notifyFarmers(harvests, "Tournée annulée", "La tournée " + tour.getCode() + " a été annulée");
    return saved;
  }

  private void linkHarvests(Tour tour, List<Harvest> harvests) {
    for (Harvest harvest : harvests) {
      harvest.setTourId(tour.getId());
      harvest.setStatus(HarvestStatus.PLANNED);
      harvest.setPlannedDate(tour.getPlannedDate());
    }
    harvestRepository.saveAll(harvests);
  }

  private void notifyFarmers(List<Harvest> harvests, String title, String message) {
    for (Harvest harvest : harvests) {
      notificationService.notifyUser(harvest.getFarmerId(), title, message, harvest.getId());
    }
  }

  private void validateTeamLeader(String teamLeaderId) {
    User leader = userRepository.findById(teamLeaderId)
        .orElseThrow(() -> new ResourceNotFoundException("User", teamLeaderId));
    if (leader.getRole() != Role.TEAM_LEADER && leader.getRole() != Role.ADMIN) {
      throw new BadRequestException("teamLeaderId must reference a TEAM_LEADER");
    }
  }

  private String resolveCode(String requestedCode) {
    String code = requestedCode == null || requestedCode.isBlank()
        ? "TOUR-" + Instant.now().getEpochSecond() + "-" + UUID.randomUUID().toString().substring(0, 6)
        : requestedCode;
    if (!tourRepository.findByCode(code).isEmpty()) {
      throw new ConflictException("Tour code already exists: " + code);
    }
    return code;
  }
}
