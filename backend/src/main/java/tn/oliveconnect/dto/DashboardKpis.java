package tn.oliveconnect.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardKpis {

  private List<YieldKpi> yieldPerOrchard;
  private double averageCollectionDelayDays;
  private double totalHarvestedKg;
  private double totalReceivedKg;
  private double totalBinCapacityKg;
  private double binFillRate;
  private List<WeeklyAlertKpi> alertsResolvedPerWeek;
}
