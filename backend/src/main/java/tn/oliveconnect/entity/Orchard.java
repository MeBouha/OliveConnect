package tn.oliveconnect.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "orchards")
public class Orchard {

  @Id
  private String id;

  @Indexed(name = "farmerId_1")
  private String farmerId;

  private String name;

  @GeoSpatialIndexed(name = "geometry_2dsphere", type = GeoSpatialIndexType.GEO_2DSPHERE)
  private GeoJsonPoint geometry;

  private double areaHa;
  private String variety;

  @Builder.Default
  private List<Plot> plots = new ArrayList<>();

  @Builder.Default
  private Instant createdAt = Instant.now();
}
