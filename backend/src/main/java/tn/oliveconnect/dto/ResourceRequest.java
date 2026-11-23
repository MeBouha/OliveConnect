package tn.oliveconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.oliveconnect.entity.ResourceStatus;
import tn.oliveconnect.entity.ResourceType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceRequest {

  @NotNull(message = "type is required")
  private ResourceType type;

  @NotBlank(message = "name is required")
  private String name;

  @Positive(message = "capacity must be positive")
  private double capacity;

  private Instant availableFrom;
  private Instant availableTo;
  private ResourceStatus status;
}
