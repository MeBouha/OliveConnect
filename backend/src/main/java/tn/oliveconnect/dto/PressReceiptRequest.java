package tn.oliveconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.oliveconnect.entity.QualityGrade;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PressReceiptRequest {

  @NotBlank(message = "harvestId is required")
  private String harvestId;

  @Positive(message = "weightKg must be positive")
  private double weightKg;

  @NotNull(message = "qualityGrade is required")
  private QualityGrade qualityGrade;

  private Instant receivedAt;
}
