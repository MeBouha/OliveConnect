package tn.oliveconnect.entity;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "presses")
public class Press {

  @Id
  private String id;

  private String name;
  private GeoJsonPoint location;
  private double capacityKgPerDay;
  private double currentLoadKg;
  private Instant lastUpdated;
}
