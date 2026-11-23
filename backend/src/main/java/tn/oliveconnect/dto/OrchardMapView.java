package tn.oliveconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.oliveconnect.entity.GeoJsonPoint;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrchardMapView {

  private String id;
  private String name;
  private GeoJsonPoint geometry;
  private double areaHa;
  private String variety;
  private Integer maturityLevel;
  private String harvestStatus;
}
