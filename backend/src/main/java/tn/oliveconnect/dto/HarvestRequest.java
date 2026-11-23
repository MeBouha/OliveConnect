package tn.oliveconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class HarvestRequest {

  @NotBlank(message = "orchardId is required")
  private String orchardId;

  @NotNull(message = "type is required")
  private HarvestType type;

  @NotNull(message = "requestedDate is required")
  private Instant requestedDate;

  private String notes;
}
