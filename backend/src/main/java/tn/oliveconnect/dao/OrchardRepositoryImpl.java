package tn.oliveconnect.dao;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Sort;
import org.springframework.data.geo.Point;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.geo.GeoJsonPolygon;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import tn.oliveconnect.dto.OrchardMapView;
import tn.oliveconnect.entity.GeoJsonPoint;
import tn.oliveconnect.entity.Harvest;
import tn.oliveconnect.entity.MaturityReading;
import tn.oliveconnect.entity.Orchard;

public class OrchardRepositoryImpl implements OrchardRepositoryCustom {

  private final MongoTemplate mongoTemplate;

  public OrchardRepositoryImpl(MongoTemplate mongoTemplate) {
    this.mongoTemplate = mongoTemplate;
  }

  @Override
  public List<OrchardMapView> findWithinBBox(double minLng, double minLat, double maxLng, double maxLat) {
    List<Point> ring = new ArrayList<>();
    ring.add(new Point(minLng, minLat));
    ring.add(new Point(maxLng, minLat));
    ring.add(new Point(maxLng, maxLat));
    ring.add(new Point(minLng, maxLat));
    ring.add(new Point(minLng, minLat));

    Query orchardQuery = new Query(Criteria.where("geometry").intersects(new GeoJsonPolygon(ring)));
    orchardQuery.fields().include("name", "geometry", "areaHa", "variety");
    orchardQuery.limit(5000);
    List<Orchard> orchards = mongoTemplate.find(orchardQuery, Orchard.class);

    List<String> orchardIds = orchards.stream().map(Orchard::getId).toList();
    if (orchardIds.isEmpty()) {
      return List.of();
    }

    Map<String, Integer> maturityByOrchard = new HashMap<>();
    Query maturityQuery = new Query(Criteria.where("orchardId").in(orchardIds));
    maturityQuery.with(Sort.by(Sort.Direction.DESC, "recordedAt"));
    for (MaturityReading reading : mongoTemplate.find(maturityQuery, MaturityReading.class)) {
      maturityByOrchard.putIfAbsent(reading.getOrchardId(), reading.getLevel());
    }

    Map<String, String> harvestStatusByOrchard = new HashMap<>();
    Query harvestQuery = new Query(Criteria.where("orchardId").in(orchardIds));
    harvestQuery.with(Sort.by(Sort.Direction.DESC, "requestedDate"));
    for (Harvest harvest : mongoTemplate.find(harvestQuery, Harvest.class)) {
      harvestStatusByOrchard.putIfAbsent(harvest.getOrchardId(), harvest.getStatus().name());
    }

    return orchards.stream().map(orchard -> OrchardMapView.builder()
        .id(orchard.getId())
        .name(orchard.getName())
        .geometry(orchard.getGeometry())
        .areaHa(orchard.getAreaHa())
        .variety(orchard.getVariety())
        .maturityLevel(maturityByOrchard.get(orchard.getId()))
        .harvestStatus(harvestStatusByOrchard.get(orchard.getId()))
        .build()).toList();
  }
}
