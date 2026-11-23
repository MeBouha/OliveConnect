package tn.oliveconnect.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import tn.oliveconnect.common.exception.ConflictException;
import tn.oliveconnect.common.exception.ResourceNotFoundException;
import tn.oliveconnect.dao.ResourceRepository;
import tn.oliveconnect.dto.ResourceRequest;
import tn.oliveconnect.dto.SupplyView;
import tn.oliveconnect.entity.Resource;
import tn.oliveconnect.entity.ResourceStatus;
import tn.oliveconnect.entity.ResourceType;
import tn.oliveconnect.entity.Tour;
import tn.oliveconnect.entity.TourStatus;
import tn.oliveconnect.mapper.DomainMapper;

@Service
public class ResourceService {

  private final ResourceRepository resourceRepository;
  private final MongoTemplate mongoTemplate;
  private final DomainMapper mapper;

  @Value("${logistics.reorder-threshold:5}")
  private double reorderThreshold;

  public ResourceService(ResourceRepository resourceRepository, MongoTemplate mongoTemplate, DomainMapper mapper) {
    this.resourceRepository = resourceRepository;
    this.mongoTemplate = mongoTemplate;
    this.mapper = mapper;
  }

  public Page<Resource> findAll(Pageable pageable) {
    return resourceRepository.findAll(pageable);
  }

  public Resource findById(String id) {
    return resourceRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Resource", id));
  }

  public Resource create(ResourceRequest request) {
    return resourceRepository.save(mapper.toEntity(request));
  }

  public Resource update(String id, ResourceRequest request) {
    Resource resource = findById(id);
    resource.setType(request.getType());
    resource.setName(request.getName());
    resource.setCapacity(request.getCapacity());
    if (request.getAvailableFrom() != null) {
      resource.setAvailableFrom(request.getAvailableFrom());
    }
    resource.setAvailableTo(request.getAvailableTo());
    resource.setStatus(request.getStatus() == null ? resource.getStatus() : request.getStatus());
    return resourceRepository.save(resource);
  }

  public void delete(String id) {
    Resource resource = findById(id);
    Query query = new Query(Criteria.where("resourceIds").is(id)
        .and("status").in(List.of(TourStatus.PLANNED, TourStatus.IN_PROGRESS)));
    if (mongoTemplate.exists(query, Tour.class)) {
      throw new ConflictException("Resource is booked on an active tour and cannot be deleted");
    }
    resourceRepository.delete(resource);
  }

  public List<Resource> availability(Instant from, Instant to, ResourceType type) {
    Set<String> bookedIds = bookedResourceIds(from, to, null);
    List<Resource> candidates = type == null
        ? resourceRepository.findAll()
        : resourceRepository.findAll().stream()
            .filter(resource -> resource.getType() == type)
            .toList();
    return candidates.stream()
        .filter(resource -> resource.getStatus() == ResourceStatus.AVAILABLE)
        .filter(resource -> !bookedIds.contains(resource.getId()))
        .filter(resource -> resource.getAvailableFrom() == null || !resource.getAvailableFrom().isAfter(to))
        .filter(resource -> resource.getAvailableTo() == null || !resource.getAvailableTo().isBefore(from))
        .toList();
  }

  public List<SupplyView> supplies() {
    double stock = resourceRepository.findAll().stream()
        .filter(resource -> resource.getType() == ResourceType.EQUIPMENT)
        .mapToDouble(Resource::getCapacity)
        .sum();
    return List.of(SupplyView.builder()
        .type(ResourceType.EQUIPMENT.name())
        .stockLevel(stock)
        .reorderThreshold(reorderThreshold)
        .reorderNeeded(stock < reorderThreshold)
        .build());
  }

  public void assertAvailable(List<String> resourceIds, Instant plannedDate, String excludeTourId) {
    if (resourceIds == null || resourceIds.isEmpty()) {
      return;
    }
    Set<String> bookedIds = bookedResourceIds(plannedDate, plannedDate, excludeTourId);
    List<Resource> resources = resourceRepository.findByIdIn(resourceIds);
    if (resources.size() != new HashSet<>(resourceIds).size()) {
      throw new ResourceNotFoundException("One or more resources");
    }
    for (Resource resource : resources) {
      if (resource.getStatus() != ResourceStatus.AVAILABLE) {
        throw new ConflictException("Resource is not available: " + resource.getName());
      }
      if (bookedIds.contains(resource.getId())) {
        throw new ConflictException("Resource is already booked on an overlapping tour: " + resource.getName());
      }
      if (resource.getAvailableFrom() != null && resource.getAvailableFrom().isAfter(plannedDate)) {
        throw new ConflictException("Resource availability starts later: " + resource.getName());
      }
      if (resource.getAvailableTo() != null && resource.getAvailableTo().isBefore(plannedDate)) {
        throw new ConflictException("Resource availability ended: " + resource.getName());
      }
    }
  }

  public List<Resource> findByIds(List<String> ids) {
    return new ArrayList<>(resourceRepository.findByIdIn(ids));
  }

  private Set<String> bookedResourceIds(Instant from, Instant to, String excludeTourId) {
    Criteria criteria = new Criteria().andOperator(
        Criteria.where("plannedDate").gte(from).lte(to),
        Criteria.where("status").in(List.of(TourStatus.PLANNED, TourStatus.IN_PROGRESS)));
    if (excludeTourId != null) {
      criteria.and("_id").ne(excludeTourId);
    }
    Query query = new Query(criteria);
    Set<String> booked = new HashSet<>();
    for (Tour tour : mongoTemplate.find(query, Tour.class)) {
      booked.addAll(tour.getResourceIds());
    }
    return booked;
  }
}
