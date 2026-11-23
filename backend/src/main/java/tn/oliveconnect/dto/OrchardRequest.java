package tn.oliveconnect.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.oliveconnect.entity.GeoJsonPoint;
import tn.oliveconnect.entity.Plot;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrchardRequest {

  @NotBlank(message = "name is required")
  private String name;

  @Valid
  @NotNull(message = "geometry is required")
  private GeoJsonPoint geometry;

  @Positive(message = "areaHa must be positive")
  private double areaHa;

  @NotBlank(message = "variety is required")
  private String variety;

  @Valid
  private List<Plot> plots;
}
