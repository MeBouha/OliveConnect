package tn.oliveconnect.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "tours")
public class Tour {

  @Id
  private String id;

  @Indexed(unique = true, name = "code_1")
  private String code;

  @Indexed(name = "plannedDate_1")
  private Instant plannedDate;

  @Indexed(name = "teamLeaderId_1")
  private String teamLeaderId;

  @Indexed(name = "status_1")
  @Builder.Default
  private TourStatus status = TourStatus.PLANNED;

  @Builder.Default
  private List<String> harvestIds = new ArrayList<>();

  @Builder.Default
  private List<String> resourceIds = new ArrayList<>();

  @Builder.Default
  private Instant createdAt = Instant.now();
}
