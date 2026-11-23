package tn.oliveconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatusView {

  private long uptimeSeconds;
  private double heapUsedMb;
  private double heapMaxMb;
  private double requestCount;
  private String mongoStatus;
}
