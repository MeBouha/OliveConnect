package tn.oliveconnect.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import tn.oliveconnect.dao.AlertRepository;
import tn.oliveconnect.dao.OrchardRepository;
import tn.oliveconnect.entity.Alert;
import tn.oliveconnect.entity.AlertStatus;
import tn.oliveconnect.entity.Role;
import tn.oliveconnect.mapper.DomainMapper;
import tn.oliveconnect.security.SecurityContextHelper;
import tn.oliveconnect.service.AlertService;
import tn.oliveconnect.service.NotificationService;

@ExtendWith(MockitoExtension.class)
class AlertServiceTest {

  @Mock private AlertRepository alertRepository;
  @Mock private OrchardRepository orchardRepository;
  @Mock private NotificationService notificationService;
  @Mock private MongoTemplate mongoTemplate;
  @Mock private DomainMapper mapper;

  @InjectMocks
  private AlertService service;

  @Test
  void resolvingAlertSetsTimestampAndResolver() {
    Alert alert = Alert.builder().id("alert-1").orchardId("orchard-1").farmerId("farmer-1")
        .status(AlertStatus.OPEN).description("test").build();
    when(alertRepository.findById("alert-1")).thenReturn(Optional.of(alert));
    when(alertRepository.save(any(Alert.class))).thenAnswer(invocation -> invocation.getArgument(0));

    try (MockedStatic<SecurityContextHelper> security = mockStatic(SecurityContextHelper.class)) {
      security.when(() -> SecurityContextHelper.hasAnyRole(Role.FARMER)).thenReturn(false);
      security.when(SecurityContextHelper::currentUserId).thenReturn("manager-1");
      Alert saved = service.updateStatus("alert-1", AlertStatus.RESOLVED);
      assertEquals(AlertStatus.RESOLVED, saved.getStatus());
      assertNotNull(saved.getResolvedAt());
      assertEquals("manager-1", saved.getResolvedBy());
    }

    ArgumentCaptor<Alert> captor = ArgumentCaptor.forClass(Alert.class);
    org.mockito.Mockito.verify(alertRepository).save(captor.capture());
    assertEquals("manager-1", captor.getValue().getResolvedBy());
  }
}
