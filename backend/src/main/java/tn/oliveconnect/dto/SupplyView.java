package tn.oliveconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplyView {

  private String type;
  private double stockLevel;
  private double reorderThreshold;
  private boolean reorderNeeded;
}
