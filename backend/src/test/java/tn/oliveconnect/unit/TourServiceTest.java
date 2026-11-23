package tn.oliveconnect.unit;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import tn.oliveconnect.common.exception.ConflictException;
import tn.oliveconnect.dao.HarvestRepository;
import tn.oliveconnect.dao.TourRepository;
import tn.oliveconnect.dao.UserRepository;
import tn.oliveconnect.dto.TourAssignRequest;
import tn.oliveconnect.entity.Harvest;
import tn.oliveconnect.entity.HarvestStatus;
import tn.oliveconnect.entity.HarvestType;
import tn.oliveconnect.entity.Role;
import tn.oliveconnect.entity.User;
import tn.oliveconnect.mapper.DomainMapper;
import tn.oliveconnect.service.NotificationService;
import tn.oliveconnect.service.ResourceService;
import tn.oliveconnect.service.TourService;

@ExtendWith(MockitoExtension.class)
class TourServiceTest {

  @Mock private TourRepository tourRepository;
  @Mock private HarvestRepository harvestRepository;
  @Mock private UserRepository userRepository;
  @Mock private ResourceService resourceService;
  @Mock private NotificationService notificationService;
  @Mock private MongoTemplate mongoTemplate;
  @Mock private DomainMapper mapper;

  @InjectMocks
  private TourService service;

  @Test
  void assignHarvestRejectsDoubleBookedResource() {
    Harvest harvest = Harvest.builder()
        .id("harvest-1")
        .orchardId("orchard-1")
        .farmerId("farmer-1")
        .type(HarvestType.PLANNED)
        .status(HarvestStatus.REQUESTED)
        .requestedDate(Instant.now())
        .build();
    User leader = User.builder().id("leader-1").role(Role.TEAM_LEADER).email("leader@oliveconnect.tn").build();
    TourAssignRequest request = new TourAssignRequest("TOUR-X", Instant.now().plusSeconds(86400),
        "leader-1", List.of("resource-tractor-1"));

    when(harvestRepository.findById("harvest-1")).thenReturn(Optional.of(harvest));
    when(userRepository.findById("leader-1")).thenReturn(Optional.of(leader));
    doThrow(new ConflictException("Resource is already booked on an overlapping tour"))
        .when(resourceService).assertAvailable(any(), any(), any());

    assertThrows(ConflictException.class, () -> service.assignHarvest("harvest-1", request));
  }
}
