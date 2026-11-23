package tn.oliveconnect.entity;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "harvests")
@CompoundIndex(name = "farmerId_1_status_1", def = "{'farmerId': 1, 'status': 1}")
public class Harvest {

  @Id
  private String id;

  @Indexed(name = "orchardId_1")
  private String orchardId;

  private String farmerId;
  private HarvestType type;

  @Indexed(name = "status_1")
  @Builder.Default
  private HarvestStatus status = HarvestStatus.REQUESTED;

  private Instant requestedDate;

  @Indexed(name = "plannedDate_1")
  private Instant plannedDate;
  private Instant actualHarvestDate;
  private double quantityKg;
  private String notes;
  private String tourId;

  @Builder.Default
  private Instant createdAt = Instant.now();
}
