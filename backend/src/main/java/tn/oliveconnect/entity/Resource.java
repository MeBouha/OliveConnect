package tn.oliveconnect.entity;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "resources")
@CompoundIndex(name = "type_1_status_1", def = "{'type': 1, 'status': 1}")
public class Resource {

  @Id
  private String id;

  private ResourceType type;
  private String name;
  private double capacity;
  private Instant availableFrom;
  private Instant availableTo;
  private ResourceStatus status;
}
