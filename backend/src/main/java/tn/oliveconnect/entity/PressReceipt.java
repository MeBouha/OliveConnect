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
@Document(collection = "press_receipts")
@CompoundIndex(name = "pressId_1_receivedAt_1", def = "{'pressId': 1, 'receivedAt': 1}")
public class PressReceipt {

  @Id
  private String id;

  @Indexed(name = "harvestId_1")
  private String harvestId;

  private String pressId;
  private double weightKg;
  private QualityGrade qualityGrade;
  private Instant receivedAt;
  private String receivedBy;
}
