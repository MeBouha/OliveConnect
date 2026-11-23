package tn.oliveconnect.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.ArithmeticOperators.Divide;
import org.springframework.data.mongodb.core.aggregation.ArithmeticOperators.Subtract;
import org.springframework.data.mongodb.core.aggregation.DateOperators;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import tn.oliveconnect.dto.DashboardKpis;
import tn.oliveconnect.dto.DelayResult;
import tn.oliveconnect.dto.SumResult;
import tn.oliveconnect.dto.WeeklyAlertKpi;
import tn.oliveconnect.dto.YieldKpi;
import tn.oliveconnect.entity.Harvest;
import tn.oliveconnect.entity.Role;
import tn.oliveconnect.security.SecurityContextHelper;

@Service
public class DashboardService {

  private final MongoTemplate mongoTemplate;

  public DashboardService(MongoTemplate mongoTemplate) {
    this.mongoTemplate = mongoTemplate;
  }

  public DashboardKpis getKpis(Instant from, Instant to, String orchardId) {
    Instant start = from == null ? Instant.now().minus(365, ChronoUnit.DAYS) : from;
    Instant end = to == null ? Instant.now().plus(30, ChronoUnit.DAYS) : to;
    Criteria harvestCriteria = new Criteria().andOperator(
        Criteria.where("createdAt").gte(start).lte(end),
        Criteria.where("status").ne("CANCELLED"));
    if (orchardId != null && !orchardId.isBlank()) {
      harvestCriteria.and("orchardId").is(orchardId);
    }
    if (SecurityContextHelper.currentUser().getRole() == Role.FARMER) {
      harvestCriteria.and("farmerId").is(SecurityContextHelper.currentUserId());
    }

    List<YieldKpi> yields = mongoTemplate.aggregate(
        Aggregation.newAggregation(
            Aggregation.match(harvestCriteria),
            Aggregation.group("orchardId").sum("quantityKg").as("harvestedKg"),
            Aggregation.lookup("orchards", "_id", "_id", "orchard"),
            Aggregation.unwind("orchard", true),
            Aggregation.project("harvestedKg")
                .and("_id").as("orchardId")
                .and("orchard.name").as("orchardName")
                .and("orchard.areaHa").as("areaHa")
                .and(Divide.valueOf("harvestedKg").divideBy("orchard.areaHa")).as("yieldKgPerHa"),
            Aggregation.sort(Sort.Direction.DESC, "harvestedKg")),
        "harvests", YieldKpi.class).getMappedResults();

    double averageDelay = mongoTemplate.aggregate(
        Aggregation.newAggregation(
            Aggregation.match(new Criteria().andOperator(
                Criteria.where("actualHarvestDate").ne(null),
                Criteria.where("plannedDate").ne(null),
                Criteria.where("status").is("COMPLETED"))),
            Aggregation.project()
                .and(Subtract.valueOf("actualHarvestDate").subtract("plannedDate")).as("delayMs"),
            Aggregation.group().avg("delayMs").as("delayMs"),
            Aggregation.project()
                .and(Divide.valueOf("delayMs").divideBy(86_400_000.0)).as("averageDelayDays")),
        "harvests", DelayResult.class).getMappedResults().stream()
        .findFirst().map(DelayResult::getAverageDelayDays).orElse(0.0);

    List<String> harvestIds = mongoTemplate.find(Query.query(harvestCriteria), Harvest.class)
        .stream().map(Harvest::getId).toList();
    Criteria receiptCriteria = Criteria.where("receivedAt").gte(start).lte(end);
    if (!harvestIds.isEmpty()) {
      receiptCriteria.and("harvestId").in(harvestIds);
    }
    double totalReceived = mongoTemplate.aggregate(
        Aggregation.newAggregation(
            Aggregation.match(receiptCriteria),
            Aggregation.group().sum("weightKg").as("total")),
        "press_receipts", SumResult.class).getMappedResults().stream()
        .findFirst().map(SumResult::getTotal).orElse(0.0);
    double totalCapacity = mongoTemplate.aggregate(
        Aggregation.newAggregation(
            Aggregation.match(Criteria.where("type").is("BIN")),
            Aggregation.group().sum("capacity").as("total")),
        "resources", SumResult.class).getMappedResults().stream()
        .findFirst().map(SumResult::getTotal).orElse(0.0);

    Criteria alertCriteria = new Criteria().andOperator(
        Criteria.where("status").is("RESOLVED"),
        Criteria.where("resolvedAt").gte(start).lte(end));
    if (orchardId != null && !orchardId.isBlank()) {
      alertCriteria.and("orchardId").is(orchardId);
    }
    if (SecurityContextHelper.currentUser().getRole() == Role.FARMER) {
      alertCriteria.and("farmerId").is(SecurityContextHelper.currentUserId());
    }
    List<WeeklyAlertKpi> weeklyAlerts = mongoTemplate.aggregate(
        Aggregation.newAggregation(
            Aggregation.match(alertCriteria),
            Aggregation.project()
                .and(DateOperators.DateToString.dateOf("resolvedAt").toString("%G-W%V")).as("week"),
            Aggregation.group("week").count().as("count"),
            Aggregation.project("count").and("_id").as("week"),
            Aggregation.sort(Sort.Direction.ASC, "week")),
        "alerts", WeeklyAlertKpi.class).getMappedResults();

    double totalHarvested = yields.stream().mapToDouble(YieldKpi::getHarvestedKg).sum();
    return DashboardKpis.builder()
        .yieldPerOrchard(yields)
        .averageCollectionDelayDays(averageDelay)
        .totalHarvestedKg(totalHarvested)
        .totalReceivedKg(totalReceived)
        .totalBinCapacityKg(totalCapacity)
        .binFillRate(totalCapacity == 0 ? 0 : totalReceived / totalCapacity)
        .alertsResolvedPerWeek(weeklyAlerts)
        .build();
  }
}
