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
import tn.oliveconnect.common.exception.ForbiddenException;
import tn.oliveconnect.common.exception.ResourceNotFoundException;
import tn.oliveconnect.dao.AlertRepository;
import tn.oliveconnect.dao.OrchardRepository;
import tn.oliveconnect.dto.AlertRequest;
import tn.oliveconnect.entity.Alert;
import tn.oliveconnect.entity.AlertStatus;
import tn.oliveconnect.entity.Role;
import tn.oliveconnect.mapper.DomainMapper;
import tn.oliveconnect.security.SecurityContextHelper;

@Service
public class AlertService {

  private final AlertRepository alertRepository;
  private final OrchardRepository orchardRepository;
  private final NotificationService notificationService;
  private final MongoTemplate mongoTemplate;
  private final DomainMapper mapper;

  public AlertService(AlertRepository alertRepository, OrchardRepository orchardRepository,
      NotificationService notificationService, MongoTemplate mongoTemplate, DomainMapper mapper) {
    this.alertRepository = alertRepository;
    this.orchardRepository = orchardRepository;
    this.notificationService = notificationService;
    this.mongoTemplate = mongoTemplate;
    this.mapper = mapper;
  }

  public Page<Alert> findAll(AlertStatus status, Pageable pageable) {
    List<Criteria> criteria = new ArrayList<>();
    if (status != null) {
      criteria.add(Criteria.where("status").is(status));
    }
    if (SecurityContextHelper.hasAnyRole(Role.FARMER)) {
      criteria.add(Criteria.where("farmerId").is(SecurityContextHelper.currentUserId()));
    }
    Query query = criteria.isEmpty() ? new Query() : new Query(new Criteria().andOperator(criteria));
    long total = mongoTemplate.count(query, Alert.class);
    query.with(pageable);
    return new PageImpl<>(mongoTemplate.find(query, Alert.class), pageable, total);
  }

  public Alert findById(String id) {
    Alert alert = alertRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Alert", id));
    if (SecurityContextHelper.hasAnyRole(Role.FARMER)
        && !alert.getFarmerId().equals(SecurityContextHelper.currentUserId())) {
      throw new ForbiddenException("This alert belongs to another farmer");
    }
    return alert;
  }

  public Alert create(AlertRequest request) {
    if (!orchardRepository.existsById(request.getOrchardId())) {
      throw new ResourceNotFoundException("Orchard", request.getOrchardId());
    }
    Alert alert = alertRepository.save(mapper.toEntity(request, SecurityContextHelper.currentUserId()));
    notificationService.notifyRole(Role.COLLECTION_MANAGER, "Nouvelle alerte de terrain",
        alert.getType() + " : " + alert.getDescription(), alert.getId());
    return alert;
  }

  public Alert updateStatus(String id, AlertStatus status) {
    Alert alert = findById(id);
    alert.setStatus(status);
    if (status == AlertStatus.RESOLVED) {
      alert.setResolvedAt(Instant.now());
      alert.setResolvedBy(SecurityContextHelper.currentUserId());
    }
    Alert saved = alertRepository.save(alert);
    notificationService.notifyUser(alert.getFarmerId(), "Statut d'alerte mis à jour",
        "L'alerte est maintenant " + status, alert.getId());
    return saved;
  }
}
