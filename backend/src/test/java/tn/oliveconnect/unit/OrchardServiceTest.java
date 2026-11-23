package tn.oliveconnect.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.oliveconnect.common.exception.ForbiddenException;
import tn.oliveconnect.dao.HarvestRepository;
import tn.oliveconnect.dao.OrchardRepository;
import tn.oliveconnect.entity.GeoJsonPoint;
import tn.oliveconnect.entity.Orchard;
import tn.oliveconnect.entity.Role;
import tn.oliveconnect.mapper.DomainMapper;
import tn.oliveconnect.security.SecurityContextHelper;
import tn.oliveconnect.service.OrchardService;

@ExtendWith(MockitoExtension.class)
class OrchardServiceTest {

  @Mock
  private OrchardRepository orchardRepository;

  @Mock
  private HarvestRepository harvestRepository;

  @Mock
  private DomainMapper mapper;

  @InjectMocks
  private OrchardService service;

  private MockedStatic<SecurityContextHelper> security;

  @BeforeEach
  void setUp() {
    security = Mockito.mockStatic(SecurityContextHelper.class);
    security.when(SecurityContextHelper::currentUserId).thenReturn("farmer-1");
    security.when(() -> SecurityContextHelper.hasAnyRole(Role.FARMER)).thenReturn(true);
    security.when(SecurityContextHelper::isAdmin).thenReturn(false);
  }

  @AfterEach
  void tearDown() {
    security.close();
  }

  @Test
  void findByIdRejectsAnotherFarmersOrchard() {
    Orchard orchard = Orchard.builder()
        .id("orchard-1")
        .farmerId("farmer-2")
        .name("Verger voisin")
        .geometry(GeoJsonPoint.of(10.7, 34.7))
        .areaHa(5)
        .variety("Chemlali")
        .build();
    when(orchardRepository.findById("orchard-1")).thenReturn(Optional.of(orchard));

    assertThrows(ForbiddenException.class, () -> service.findById("orchard-1"));
  }

  @Test
  void createAssignsCurrentFarmer() {
    tn.oliveconnect.dto.OrchardRequest request = new tn.oliveconnect.dto.OrchardRequest(
        "Verger neuf", GeoJsonPoint.of(10.7, 34.7), 4.5, "Chetoui", java.util.List.of());
    Orchard mapped = Orchard.builder().farmerId("farmer-1").name("Verger neuf").build();
    when(mapper.toEntity(request, "farmer-1")).thenReturn(mapped);
    when(orchardRepository.save(mapped)).thenReturn(mapped);

    Orchard saved = service.create(request);

    assertEquals("farmer-1", saved.getFarmerId());
    assertEquals("Verger neuf", saved.getName());
  }
}
