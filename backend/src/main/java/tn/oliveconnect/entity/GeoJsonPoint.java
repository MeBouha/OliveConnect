package tn.oliveconnect.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeoJsonPoint {

  private String type = "Point";
  private double[] coordinates;

  public static GeoJsonPoint of(double longitude, double latitude) {
    return new GeoJsonPoint("Point", new double[]{longitude, latitude});
  }
}
