package tn.oliveconnect.entity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Plot {

  private String plotId;

  @NotBlank(message = "plot name is required")
  private String name;

  @Positive(message = "plot areaHa must be positive")
  private double areaHa;
}
