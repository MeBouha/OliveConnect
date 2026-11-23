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
@Document(collection = "maturity_readings")
@CompoundIndex(name = "orchardId_1_recordedAt_-1", def = "{'orchardId': 1, 'recordedAt': -1}")
public class MaturityReading {

  @Id
  private String id;

  private String orchardId;
  private int level;
  private MaturitySource source;
  private Instant recordedAt;
}
