package tn.oliveconnect.entity;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GeoJsonPoint {

  @NotNull(message = "type is required")
  private String type = "Point";

  @NotNull(message = "coordinates are required")
  @Size(min = 2, max = 2, message = "coordinates must contain longitude and latitude")
  private double[] coordinates;

  public static GeoJsonPoint of(double longitude, double latitude) {
    return new GeoJsonPoint("Point", new double[]{longitude, latitude});
  }
}
