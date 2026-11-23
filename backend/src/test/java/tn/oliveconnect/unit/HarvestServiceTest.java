package tn.oliveconnect.unit;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.oliveconnect.common.exception.ConflictException;
import tn.oliveconnect.dao.HarvestRepository;
import tn.oliveconnect.dao.OrchardRepository;
import tn.oliveconnect.dao.TourRepository;
import tn.oliveconnect.entity.Harvest;
import tn.oliveconnect.entity.HarvestStatus;
import tn.oliveconnect.entity.HarvestType;
import tn.oliveconnect.entity.Role;
import tn.oliveconnect.mapper.DomainMapper;
import tn.oliveconnect.security.SecurityContextHelper;
import tn.oliveconnect.service.HarvestService;
import tn.oliveconnect.service.NotificationService;
import tn.oliveconnect.service.TourService;
import org.springframework.data.mongodb.core.MongoTemplate;

@ExtendWith(MockitoExtension.class)
class HarvestServiceTest {

  @Mock private HarvestRepository harvestRepository;
  @Mock private OrchardRepository orchardRepository;
  @Mock private TourRepository tourRepository;
  @Mock private TourService tourService;
  @Mock private NotificationService notificationService;
  @Mock private MongoTemplate mongoTemplate;
  @Mock private DomainMapper mapper;

  @InjectMocks
  private HarvestService service;

  @Test
  void cancelRejectsCompletedHarvest() {
    Harvest harvest = Harvest.builder()
        .id("harvest-1")
        .orchardId("orchard-1")
        .farmerId("farmer-1")
        .type(HarvestType.URGENT)
        .status(HarvestStatus.COMPLETED)
        .build();
    when(harvestRepository.findById("harvest-1")).thenReturn(Optional.of(harvest));

    try (MockedStatic<SecurityContextHelper> security = mockStatic(SecurityContextHelper.class)) {
      security.when(() -> SecurityContextHelper.hasAnyRole(Role.FARMER)).thenReturn(false);
      security.when(() -> SecurityContextHelper.hasAnyRole(Role.COLLECTION_MANAGER, Role.ADMIN)).thenReturn(true);
      assertThrows(ConflictException.class, () -> service.cancel("harvest-1"));
    }
  }
}
