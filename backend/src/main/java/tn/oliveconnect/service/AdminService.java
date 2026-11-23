package tn.oliveconnect.service;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import java.lang.management.ManagementFactory;
import org.bson.Document;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;
import tn.oliveconnect.common.exception.BadRequestException;
import tn.oliveconnect.common.exception.ResourceNotFoundException;
import tn.oliveconnect.dao.UserRepository;
import tn.oliveconnect.dto.AdminStatusView;
import tn.oliveconnect.dto.ImportTriggerRequest;
import tn.oliveconnect.entity.Role;
import tn.oliveconnect.entity.User;
import tn.oliveconnect.security.SecurityContextHelper;

@Service
public class AdminService {

  private final UserRepository userRepository;
  private final MongoTemplate mongoTemplate;
  private final MeterRegistry meterRegistry;
  private final ApplicationEventPublisher eventPublisher;

  public AdminService(UserRepository userRepository, MongoTemplate mongoTemplate,
      MeterRegistry meterRegistry, ApplicationEventPublisher eventPublisher) {
    this.userRepository = userRepository;
    this.mongoTemplate = mongoTemplate;
    this.meterRegistry = meterRegistry;
    this.eventPublisher = eventPublisher;
  }

  public Page<User> findUsers(Pageable pageable) {
    return userRepository.findAll(pageable);
  }

  public User updateRole(String id, Role role) {
    if (id.equals(SecurityContextHelper.currentUserId())) {
      throw new BadRequestException("An administrator cannot change their own role");
    }
    if (role == Role.VISITOR) {
      throw new BadRequestException("VISITOR cannot be assigned to a stored account");
    }
    User user = userRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("User", id));
    user.setRole(role);
    return userRepository.save(user);
  }

  public void triggerImport(ImportTriggerRequest request) {
    if (!request.getSource().equals("weather-json") && !request.getSource().equals("maturity-sensor-csv")) {
      throw new BadRequestException("Unknown import source: " + request.getSource());
    }
    eventPublisher.publishEvent(new ImportRequestedEvent(request.getSource()));
  }

  public AdminStatusView status() {
    Runtime runtime = Runtime.getRuntime();
    double heapUsedMb = (runtime.totalMemory() - runtime.freeMemory()) / (1024.0 * 1024.0);
    double heapMaxMb = runtime.maxMemory() / (1024.0 * 1024.0);
    Timer requestTimer = meterRegistry.find("http.server.requests").timer();
    double requestCount = requestTimer == null ? 0.0 : requestTimer.count();
    String mongoStatus;
    try {
      Document ping = mongoTemplate.getDb().runCommand(new Document("ping", 1));
      mongoStatus = ping.get("ok", 0) == 1 ? "UP" : "DOWN";
    } catch (RuntimeException exception) {
      mongoStatus = "DOWN";
    }
    return AdminStatusView.builder()
        .uptimeSeconds(ManagementFactory.getRuntimeMXBean().getUptime() / 1000)
        .heapUsedMb(Math.round(heapUsedMb * 100.0) / 100.0)
        .heapMaxMb(Math.round(heapMaxMb * 100.0) / 100.0)
        .requestCount(requestCount)
        .mongoStatus(mongoStatus)
        .build();
  }
}
