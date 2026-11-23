package tn.oliveconnect.unit;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import tn.oliveconnect.common.exception.ConflictException;
import tn.oliveconnect.dao.ResourceRepository;
import tn.oliveconnect.entity.Resource;
import tn.oliveconnect.entity.ResourceStatus;
import tn.oliveconnect.entity.ResourceType;
import tn.oliveconnect.entity.Tour;
import tn.oliveconnect.mapper.DomainMapper;
import tn.oliveconnect.service.ResourceService;

@ExtendWith(MockitoExtension.class)
class ResourceServiceTest {

  @Mock private ResourceRepository resourceRepository;
  @Mock private MongoTemplate mongoTemplate;
  @Mock private DomainMapper mapper;

  @InjectMocks
  private ResourceService service;

  @Test
  void deleteRejectsResourceBookedOnActiveTour() {
    Resource resource = Resource.builder().id("resource-1").name("Tractor 1")
        .type(ResourceType.TRACTOR).capacity(1).status(ResourceStatus.AVAILABLE).build();
    when(resourceRepository.findById("resource-1")).thenReturn(Optional.of(resource));
    when(mongoTemplate.exists(any(), eq(Tour.class))).thenReturn(true);

    assertThrows(ConflictException.class, () -> service.delete("resource-1"));
  }
}
