package tn.oliveconnect.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Plot {

  private String plotId;
  private String name;
  private double areaHa;
}
