package tn.oliveconnect.scheduler;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import tn.oliveconnect.dao.ImportLogRepository;
import tn.oliveconnect.dao.MaturityReadingRepository;
import tn.oliveconnect.dao.OrchardRepository;
import tn.oliveconnect.dao.PressRepository;
import tn.oliveconnect.entity.ImportLog;
import tn.oliveconnect.entity.ImportStatus;
import tn.oliveconnect.entity.MaturityReading;
import tn.oliveconnect.entity.MaturitySource;
import tn.oliveconnect.entity.Press;
import tn.oliveconnect.service.ImportRequestedEvent;

@Component
public class ImportScheduler {

  private static final Logger log = LogManager.getLogger(ImportScheduler.class);

  private final ImportLogRepository importLogRepository;
  private final MaturityReadingRepository maturityReadingRepository;
  private final OrchardRepository orchardRepository;
  private final PressRepository pressRepository;
  private final ObjectMapper objectMapper;

  @Value("${imports.enabled:true}")
  private boolean enabled;

  public ImportScheduler(ImportLogRepository importLogRepository,
      MaturityReadingRepository maturityReadingRepository, OrchardRepository orchardRepository,
      PressRepository pressRepository, ObjectMapper objectMapper) {
    this.importLogRepository = importLogRepository;
    this.maturityReadingRepository = maturityReadingRepository;
    this.orchardRepository = orchardRepository;
    this.pressRepository = pressRepository;
    this.objectMapper = objectMapper;
  }

  @Scheduled(fixedDelayString = "${imports.interval-ms:600000}", initialDelayString = "${imports.interval-ms:600000}")
  public void runScheduledImports() {
    if (!enabled) {
      return;
    }
    runWeatherJson();
    runMaturityCsv();
  }

  @EventListener
  public void onImportRequested(ImportRequestedEvent event) {
    if (event.source().equals("weather-json")) {
      runWeatherJson();
    } else if (event.source().equals("maturity-sensor-csv")) {
      runMaturityCsv();
    }
  }

  public void runWeatherJson() {
    Instant startedAt = Instant.now();
    int imported = 0;
    int rejected = 0;
    try {
      JsonNode records = objectMapper.readTree(generateWeatherJson());
      List<MaturityReading> readings = new ArrayList<>();
      Map<String, Double> pressDeltas = new HashMap<>();
      for (JsonNode node : records) {
        JsonNode orchardNode = node.get("orchardId");
        JsonNode levelNode = node.get("level");
        JsonNode sourceNode = node.get("source");
        JsonNode pressNode = node.get("pressId");
        JsonNode deltaNode = node.get("loadDeltaKg");
        if (orchardNode == null || orchardNode.asText().isBlank()
            || levelNode == null || levelNode.asInt() < 0 || levelNode.asInt() > 100
            || sourceNode == null || pressNode == null || deltaNode == null) {
          rejected++;
          continue;
        }
        readings.add(MaturityReading.builder()
            .orchardId(orchardNode.asText())
            .level(levelNode.asInt())
            .source(MaturitySource.valueOf(sourceNode.asText()))
            .recordedAt(Instant.now())
            .build());
        pressDeltas.merge(pressNode.asText(), deltaNode.asDouble(), Double::sum);
        imported++;
      }
      maturityReadingRepository.saveAll(readings);
      pressDeltas.forEach(this::applyPressLoad);
      finish("weather-json", startedAt, imported, rejected,
          rejected > 0 ? ImportStatus.PARTIAL : ImportStatus.SUCCESS);
    } catch (Exception exception) {
      log.error("Weather import failed", exception);
      finish("weather-json", startedAt, imported, rejected, ImportStatus.FAILED);
    }
  }

  public void runMaturityCsv() {
    Instant startedAt = Instant.now();
    int imported = 0;
    int rejected = 0;
    try {
      List<String> lines = generateMaturityCsv();
      Set<String> knownOrchardIds = new HashSet<>(orchardRepository
          .findAll(PageRequest.of(0, 100)).getContent().stream().map(orchard -> orchard.getId()).toList());
      List<MaturityReading> readings = new ArrayList<>();
      for (int i = 1; i < lines.size(); i++) {
        String[] fields = lines.get(i).split(",");
        if (fields.length != 4 || fields[0].isBlank() || !knownOrchardIds.contains(fields[0])) {
          rejected++;
          continue;
        }
        try {
          int level = Integer.parseInt(fields[1]);
          MaturitySource source = MaturitySource.valueOf(fields[2]);
          Instant recordedAt = Instant.parse(fields[3]);
          if (level < 0 || level > 100) {
            rejected++;
            continue;
          }
          readings.add(MaturityReading.builder()
              .orchardId(fields[0])
              .level(level)
              .source(source)
              .recordedAt(recordedAt)
              .build());
          imported++;
        } catch (IllegalArgumentException exception) {
          rejected++;
        }
      }
      maturityReadingRepository.saveAll(readings);
      finish("maturity-sensor-csv", startedAt, imported, rejected,
          rejected > 0 ? ImportStatus.PARTIAL : ImportStatus.SUCCESS);
    } catch (Exception exception) {
      log.error("Maturity CSV import failed", exception);
      finish("maturity-sensor-csv", startedAt, imported, rejected, ImportStatus.FAILED);
    }
  }

  private String generateWeatherJson() throws Exception {
    List<String> orchardIds = orchardRepository.findAll(PageRequest.of(0, 20))
        .getContent().stream().map(orchard -> orchard.getId()).toList();
    List<Map<String, Object>> rows = new ArrayList<>();
    for (int i = 0; i < orchardIds.size(); i++) {
      Map<String, Object> row = new HashMap<>();
      row.put("orchardId", orchardIds.get(i));
      row.put("level", 45 + (i * 3) % 50);
      row.put("source", "WEATHER");
      row.put("pressId", i % 2 == 0 ? "press-1" : "press-2");
      row.put("loadDeltaKg", 5.0 + i);
      rows.add(row);
    }
    Map<String, Object> invalid = new HashMap<>();
    invalid.put("orchardId", "");
    invalid.put("level", 150);
    invalid.put("source", "WEATHER");
    invalid.put("pressId", "press-1");
    invalid.put("loadDeltaKg", 10.0);
    rows.add(invalid);
    return objectMapper.writeValueAsString(rows);
  }

  private List<String> generateMaturityCsv() {
    List<String> orchardIds = orchardRepository.findAll(PageRequest.of(0, 30))
        .getContent().stream().map(orchard -> orchard.getId()).toList();
    List<String> lines = new ArrayList<>();
    lines.add("orchardId,level,source,recordedAt");
    String now = Instant.now().toString();
    for (int i = 0; i < orchardIds.size(); i++) {
      lines.add(orchardIds.get(i) + "," + (50 + (i * 2) % 45) + ",SENSOR," + now);
    }
    lines.add("orchard-9999,88,SENSOR," + now);
    lines.add("orchard-0001,150,SENSOR," + now);
    lines.add("orchard-0002,77,UNKNOWN_SOURCE," + now);
    return lines;
  }

  private void applyPressLoad(String pressId, double delta) {
    Press press = pressRepository.findById(pressId).orElse(null);
    if (press == null) {
      return;
    }
    double updated = Math.min(press.getCapacityKgPerDay(), press.getCurrentLoadKg() + delta);
    press.setCurrentLoadKg(updated);
    press.setLastUpdated(Instant.now());
    pressRepository.save(press);
  }

  private void finish(String source, Instant startedAt, int imported, int rejected, ImportStatus status) {
    importLogRepository.save(ImportLog.builder()
        .source(source)
        .recordsImported(imported)
        .recordsRejected(rejected)
        .startedAt(startedAt)
        .finishedAt(Instant.now())
        .status(status)
        .build());
    log.info("Import {} finished with status {} ({} imported, {} rejected)", source, status, imported, rejected);
  }
}
