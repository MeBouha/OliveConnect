package tn.oliveconnect.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.oliveconnect.entity.TourStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TourProgressRequest {

  @NotNull(message = "status is required")
  private TourStatus status;

  @Valid
  private List<HarvestQuantityUpdate> harvestUpdates;
}
