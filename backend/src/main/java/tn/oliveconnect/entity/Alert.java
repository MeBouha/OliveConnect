package tn.oliveconnect.entity;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "alerts")
@CompoundIndex(name = "status_1_createdAt_-1", def = "{'status': 1, 'createdAt': -1}")
public class Alert {

  @Id
  private String id;

  private String orchardId;
  private String farmerId;
  private AlertType type;
  private String description;

  @GeoSpatialIndexed(name = "location_2dsphere", type = GeoSpatialIndexType.GEO_2DSPHERE)
  private GeoJsonPoint location;

  @Builder.Default
  private AlertStatus status = AlertStatus.OPEN;

  @Builder.Default
  private Instant createdAt = Instant.now();

  private Instant resolvedAt;
  private String resolvedBy;
}
