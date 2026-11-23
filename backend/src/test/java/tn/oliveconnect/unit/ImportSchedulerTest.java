package tn.oliveconnect.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import tn.oliveconnect.dao.ImportLogRepository;
import tn.oliveconnect.dao.MaturityReadingRepository;
import tn.oliveconnect.dao.OrchardRepository;
import tn.oliveconnect.dao.PressRepository;
import tn.oliveconnect.entity.ImportLog;
import tn.oliveconnect.entity.ImportStatus;
import tn.oliveconnect.entity.Orchard;
import tn.oliveconnect.entity.Press;
import tn.oliveconnect.scheduler.ImportScheduler;

@ExtendWith(MockitoExtension.class)
class ImportSchedulerTest {

  @Mock private ImportLogRepository importLogRepository;
  @Mock private MaturityReadingRepository maturityReadingRepository;
  @Mock private OrchardRepository orchardRepository;
  @Mock private PressRepository pressRepository;

  private ImportScheduler scheduler;

  @BeforeEach
  void setUp() {
    scheduler = new ImportScheduler(importLogRepository, maturityReadingRepository,
        orchardRepository, pressRepository, new ObjectMapper());
  }

  @Test
  void weatherImportRejectsInvalidRowsAndLogsPartialSuccess() {
    Orchard orchard = Orchard.builder().id("orchard-1").name("Test").areaHa(10).build();
    Press press = Press.builder().id("press-1").name("Press 1").capacityKgPerDay(1000)
        .currentLoadKg(100).build();
    when(orchardRepository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(orchard)));
    when(pressRepository.findById(anyString())).thenReturn(Optional.of(press));
    when(maturityReadingRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));
    when(importLogRepository.save(any(ImportLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

    scheduler.runWeatherJson();

    ArgumentCaptor<ImportLog> captor = ArgumentCaptor.forClass(ImportLog.class);
    verify(importLogRepository).save(captor.capture());
    ImportLog log = captor.getValue();
    assertEquals("weather-json", log.getSource());
    assertEquals(ImportStatus.PARTIAL, log.getStatus());
    assertEquals(1, log.getRecordsImported());
    assertEquals(1, log.getRecordsRejected());
    assertTrue(press.getCurrentLoadKg() > 100);
  }

  @Test
  void csvImportRejectsUnknownOrchardAndInvalidLevel() {
    Orchard orchard = Orchard.builder().id("orchard-1").name("Test").areaHa(10).build();
    when(orchardRepository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(orchard)));
    when(maturityReadingRepository.saveAll(anyList())).thenAnswer(invocation -> invocation.getArgument(0));
    when(importLogRepository.save(any(ImportLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

    scheduler.runMaturityCsv();

    ArgumentCaptor<ImportLog> captor = ArgumentCaptor.forClass(ImportLog.class);
    verify(importLogRepository).save(captor.capture());
    assertEquals(ImportStatus.PARTIAL, captor.getValue().getStatus());
    assertEquals(1, captor.getValue().getRecordsImported());
    assertEquals(3, captor.getValue().getRecordsRejected());
  }
}
