package tn.oliveconnect.config;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import tn.oliveconnect.dao.AlertRepository;
import tn.oliveconnect.dao.HarvestRepository;
import tn.oliveconnect.dao.ImportLogRepository;
import tn.oliveconnect.dao.MaturityReadingRepository;
import tn.oliveconnect.dao.NotificationRepository;
import tn.oliveconnect.dao.OrchardRepository;
import tn.oliveconnect.dao.PressReceiptRepository;
import tn.oliveconnect.dao.PressRepository;
import tn.oliveconnect.dao.ResourceRepository;
import tn.oliveconnect.dao.TourRepository;
import tn.oliveconnect.dao.UserRepository;
import tn.oliveconnect.entity.Alert;
import tn.oliveconnect.entity.AlertStatus;
import tn.oliveconnect.entity.AlertType;
import tn.oliveconnect.entity.GeoJsonPoint;
import tn.oliveconnect.entity.Harvest;
import tn.oliveconnect.entity.HarvestStatus;
import tn.oliveconnect.entity.HarvestType;
import tn.oliveconnect.entity.ImportLog;
import tn.oliveconnect.entity.ImportStatus;
import tn.oliveconnect.entity.MaturityReading;
import tn.oliveconnect.entity.MaturitySource;
import tn.oliveconnect.entity.Notification;
import tn.oliveconnect.entity.Orchard;
import tn.oliveconnect.entity.Plot;
import tn.oliveconnect.entity.Press;
import tn.oliveconnect.entity.PressReceipt;
import tn.oliveconnect.entity.QualityGrade;
import tn.oliveconnect.entity.Resource;
import tn.oliveconnect.entity.ResourceStatus;
import tn.oliveconnect.entity.ResourceType;
import tn.oliveconnect.entity.Role;
import tn.oliveconnect.entity.Tour;
import tn.oliveconnect.entity.TourStatus;
import tn.oliveconnect.entity.User;

@Configuration
public class DataInitializer {

  private static final Logger log = LogManager.getLogger(DataInitializer.class);

  @Bean
  @Order(2)
  public ApplicationRunner seedDemoData(UserRepository userRepository, OrchardRepository orchardRepository,
      MaturityReadingRepository maturityReadingRepository, HarvestRepository harvestRepository,
      AlertRepository alertRepository, TourRepository tourRepository, ResourceRepository resourceRepository,
      PressRepository pressRepository, PressReceiptRepository pressReceiptRepository,
      NotificationRepository notificationRepository, ImportLogRepository importLogRepository) {
    return args -> {
      if (userRepository.count() > 0) {
        log.info("Demo data already present: skipping seed");
        return;
      }

      BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
      List<User> users = new ArrayList<>();
      users.add(user("admin@oliveconnect.tn", "Admin@123", "Admin Principal", "+216 20 00 00 01", Role.ADMIN, encoder));
      users.add(user("farmer@oliveconnect.tn", "Farmer@123", "Mohamed Benali", "+216 20 00 00 02", Role.FARMER, encoder));
      users.add(user("manager@oliveconnect.tn", "Manager@123", "Amina Trabelsi", "+216 20 00 00 03", Role.COLLECTION_MANAGER, encoder));
      users.add(user("leader@oliveconnect.tn", "Leader@123", "Karim Sfar", "+216 20 00 00 04", Role.TEAM_LEADER, encoder));
      users.add(user("logistics@oliveconnect.tn", "Logistics@123", "Sonia Gharbi", "+216 20 00 00 05", Role.LOGISTICS_MANAGER, encoder));
      users.add(user("press@oliveconnect.tn", "Press@123", "Hedi Bouchiba", "+216 20 00 00 06", Role.PRESS_MANAGER, encoder));
      users.add(user("farmer2@oliveconnect.tn", "Farmer@123", "Lina Ksibi", "+216 20 00 00 07", Role.FARMER, encoder));
      users.add(user("farmer3@oliveconnect.tn", "Farmer@123", "Ali Nouri", "+216 20 00 00 08", Role.FARMER, encoder));
      users.add(user("farmer4@oliveconnect.tn", "Farmer@123", "Nadia Ferjani", "+216 20 00 00 09", Role.FARMER, encoder));
      users.add(user("farmer5@oliveconnect.tn", "Farmer@123", "Omar Jallel", "+216 20 00 00 10", Role.FARMER, encoder));
      userRepository.saveAll(users);

      String mainFarmerId = users.get(1).getId();
      String managerId = users.get(2).getId();
      String leaderId = users.get(3).getId();
      String pressManagerId = users.get(5).getId();
      List<String> farmerIds = List.of(mainFarmerId, users.get(6).getId(), users.get(7).getId(),
          users.get(8).getId(), users.get(9).getId());

      Random random = new Random(42);
      List<Orchard> orchards = new ArrayList<>();
      List<MaturityReading> readings = new ArrayList<>();
      String[] varieties = {"Chemlali", "Chetoui", "Zalmati", "Oueslati"};
      for (int i = 0; i < 500; i++) {
        String orchardId = "orchard-" + String.format("%04d", i + 1);
        double longitude = 10.42 + random.nextDouble() * 0.72;
        double latitude = 34.52 + random.nextDouble() * 0.48;
        List<Plot> plots = new ArrayList<>();
        int plotCount = 2 + random.nextInt(3);
        for (int p = 0; p < plotCount; p++) {
          plots.add(new Plot("plot-" + orchardId + "-" + (p + 1), "Parcelle " + (p + 1),
              Math.round((0.5 + random.nextDouble() * 2.0) * 100.0) / 100.0));
        }
        orchards.add(Orchard.builder()
            .id(orchardId)
            .farmerId(farmerIds.get(i % farmerIds.size()))
            .name("Verger " + (i + 1))
            .geometry(GeoJsonPoint.of(longitude, latitude))
            .areaHa(Math.round((2 + random.nextDouble() * 18) * 100.0) / 100.0)
            .variety(varieties[i % varieties.length])
            .plots(plots)
            .createdAt(Instant.now().minus(400 - i % 300, ChronoUnit.DAYS))
            .build());

        int baseLevel = 30 + random.nextInt(65);
        readings.add(MaturityReading.builder()
            .orchardId(orchardId)
            .level(Math.min(100, baseLevel))
            .source(i % 3 == 0 ? MaturitySource.SENSOR : MaturitySource.MANUAL)
            .recordedAt(Instant.now().minus(random.nextInt(30), ChronoUnit.DAYS))
            .build());
        if (i % 4 == 0) {
          readings.add(MaturityReading.builder()
              .orchardId(orchardId)
              .level(Math.min(100, baseLevel + 8))
              .source(MaturitySource.WEATHER)
              .recordedAt(Instant.now().minus(random.nextInt(10), ChronoUnit.DAYS))
              .build());
        }
      }
      orchardRepository.saveAll(orchards);
      maturityReadingRepository.saveAll(readings);

      List<Resource> resources = new ArrayList<>();
      for (int i = 1; i <= 20; i++) {
        resources.add(resource("resource-worker-" + i, "WORKER", "Saisonnier " + i, 1, ResourceStatus.AVAILABLE));
      }
      for (int i = 1; i <= 6; i++) {
        resources.add(resource("resource-tractor-" + i, "TRACTOR", "Tracteur " + i, 1, ResourceStatus.AVAILABLE));
      }
      for (int i = 1; i <= 40; i++) {
        resources.add(resource("resource-bin-" + i, "BIN", "Bin " + i, 500, ResourceStatus.AVAILABLE));
      }
      for (int i = 1; i <= 10; i++) {
        resources.add(resource("resource-equipment-" + i, "EQUIPMENT",
            i % 2 == 0 ? "Filet " + i : "Vibrateur " + i, 1, ResourceStatus.AVAILABLE));
      }
      resourceRepository.saveAll(resources);

      List<Press> presses = List.of(
          Press.builder().id("press-1").name("Pressoir Sfax Centre")
              .location(GeoJsonPoint.of(10.7600, 34.7400)).capacityKgPerDay(8000)
              .currentLoadKg(2450).lastUpdated(Instant.now()).build(),
          Press.builder().id("press-2").name("Pressoir Sakiet Ezzit")
              .location(GeoJsonPoint.of(10.7900, 34.7500)).capacityKgPerDay(6000)
              .currentLoadKg(1200).lastUpdated(Instant.now()).build());
      pressRepository.saveAll(presses);

      List<Tour> tours = new ArrayList<>();
      List<Harvest> harvests = new ArrayList<>();
      List<PressReceipt> receipts = new ArrayList<>();
      for (int i = 0; i < 20; i++) {
        String tourId = "tour-" + String.format("%03d", i + 1);
        Instant plannedDate = i < 15
            ? Instant.now().minus(120 - i * 6, ChronoUnit.DAYS)
            : Instant.now().plus((i - 14) * 5L, ChronoUnit.DAYS);
        TourStatus tourStatus = i < 15 ? TourStatus.COMPLETED : TourStatus.PLANNED;
        List<String> harvestIds = new ArrayList<>();
        for (int h = 0; h < 5; h++) {
          String harvestId = "harvest-seed-" + (i * 5 + h + 1);
          harvestIds.add(harvestId);
          boolean completed = i < 15;
          HarvestStatus status = completed ? HarvestStatus.COMPLETED : HarvestStatus.PLANNED;
          Instant actualDate = completed ? plannedDate.plus(2, ChronoUnit.DAYS) : null;
          double quantity = 400 + random.nextInt(1600);
          harvests.add(Harvest.builder()
              .id(harvestId)
              .orchardId("orchard-" + String.format("%04d", i * 5 + h + 1))
              .farmerId(farmerIds.get((i * 5 + h) % farmerIds.size()))
              .type((i + h) % 4 == 0 ? HarvestType.URGENT : HarvestType.PLANNED)
              .status(status)
              .requestedDate(plannedDate.minus(10, ChronoUnit.DAYS))
              .plannedDate(plannedDate)
              .actualHarvestDate(actualDate)
              .quantityKg(quantity)
              .notes("Récolte de démonstration")
              .tourId(tourId)
              .createdAt(plannedDate.minus(12, ChronoUnit.DAYS))
              .build());
          if (completed) {
            receipts.add(PressReceipt.builder()
                .id("receipt-" + (i * 5 + h + 1))
                .harvestId(harvestId)
                .pressId(i % 2 == 0 ? "press-1" : "press-2")
                .weightKg(quantity - random.nextInt(40))
                .qualityGrade(QualityGrade.values()[random.nextInt(3)])
                .receivedAt(plannedDate.plus(4, ChronoUnit.DAYS))
                .receivedBy(pressManagerId)
                .build());
          }
        }
        tours.add(Tour.builder()
            .id(tourId)
            .code("TOUR-2026-" + String.format("%03d", i + 1))
            .plannedDate(plannedDate)
            .teamLeaderId(leaderId)
            .status(tourStatus)
            .harvestIds(harvestIds)
            .resourceIds(List.of("resource-worker-" + (i + 1), "resource-tractor-" + (i + 1)))
            .createdAt(plannedDate.minus(15, ChronoUnit.DAYS))
            .build());
      }
      tourRepository.saveAll(tours);
      harvestRepository.saveAll(harvests);
      pressReceiptRepository.saveAll(receipts);

      List<Alert> alerts = new ArrayList<>();
      for (int i = 0; i < 24; i++) {
        alerts.add(Alert.builder()
            .id("alert-" + (i + 1))
            .orchardId("orchard-" + String.format("%04d", i + 1))
            .farmerId(farmerIds.get(i % farmerIds.size()))
            .type(AlertType.values()[i % AlertType.values().length])
            .description("Alerte de démonstration " + (i + 1))
            .location(orchards.get(i).getGeometry())
            .status(i % 3 == 0 ? AlertStatus.OPEN : (i % 3 == 1 ? AlertStatus.ACKNOWLEDGED : AlertStatus.RESOLVED))
            .createdAt(Instant.now().minus(i, ChronoUnit.DAYS))
            .resolvedAt(i % 3 == 2 ? Instant.now().minus(i - 1, ChronoUnit.DAYS) : null)
            .resolvedBy(i % 3 == 2 ? managerId : null)
            .build());
      }
      alertRepository.saveAll(alerts);

      List<Notification> notifications = new ArrayList<>();
      for (int i = 0; i < 12; i++) {
        notifications.add(Notification.builder()
            .userId(i % 2 == 0 ? mainFarmerId : managerId)
            .title(i % 2 == 0 ? "Tournée planifiée" : "Nouvelle alerte")
            .message("Notification de démonstration " + (i + 1))
            .read(i % 4 == 0)
            .createdAt(Instant.now().minus(i * 6, ChronoUnit.HOURS))
            .relatedEntityId(i % 2 == 0 ? "tour-001" : "alert-1")
            .build());
      }
      notificationRepository.saveAll(notifications);

      Instant importStart = Instant.now().minus(2, ChronoUnit.HOURS);
      importLogRepository.saveAll(List.of(
          ImportLog.builder().source("weather-json").recordsImported(120).recordsRejected(3)
              .startedAt(importStart).finishedAt(importStart.plusSeconds(12)).status(ImportStatus.PARTIAL).build(),
          ImportLog.builder().source("maturity-sensor-csv").recordsImported(500).recordsRejected(0)
              .startedAt(importStart.minus(1, ChronoUnit.HOURS)).finishedAt(importStart.minus(1, ChronoUnit.HOURS).plusSeconds(25))
              .status(ImportStatus.SUCCESS).build()));

      log.info("Seed completed: {} users, {} orchards, {} readings, {} harvests, {} tours, {} receipts",
          users.size(), orchards.size(), readings.size(), harvests.size(), tours.size(), receipts.size());
    };
  }

  private User user(String email, String password, String fullName, String phone, Role role,
      BCryptPasswordEncoder encoder) {
    return User.builder()
        .email(email)
        .passwordHash(encoder.encode(password))
        .fullName(fullName)
        .phone(phone)
        .role(role)
        .active(true)
        .createdAt(Instant.now())
        .build();
  }

  private Resource resource(String id, String type, String name, double capacity, ResourceStatus status) {
    return Resource.builder()
        .id(id)
        .type(ResourceType.valueOf(type))
        .name(name)
        .capacity(capacity)
        .availableFrom(Instant.now().minus(100, ChronoUnit.DAYS))
        .availableTo(Instant.now().plus(300, ChronoUnit.DAYS))
        .status(status)
        .build();
  }
}
