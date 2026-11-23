package tn.oliveconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class YieldKpi {

  private String orchardId;
  private String orchardName;
  private double harvestedKg;
  private double areaHa;
  private double yieldKgPerHa;
}
