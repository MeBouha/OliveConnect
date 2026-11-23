package tn.oliveconnect.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.oliveconnect.entity.HarvestType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HarvestUpdateRequest {

  private HarvestType type;
  private Instant requestedDate;
  private String notes;
}
