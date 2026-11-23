package tn.oliveconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TourRequest {

  private String code;

  @NotNull(message = "plannedDate is required")
  private Instant plannedDate;

  @NotBlank(message = "teamLeaderId is required")
  private String teamLeaderId;

  private List<String> harvestIds;
  private List<String> resourceIds;
}
