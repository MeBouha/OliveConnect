package tn.oliveconnect.dao;

import java.util.List;
import tn.oliveconnect.dto.OrchardMapView;

public interface OrchardRepositoryCustom {

  List<OrchardMapView> findWithinBBox(double minLng, double minLat, double maxLng, double maxLat);
}
