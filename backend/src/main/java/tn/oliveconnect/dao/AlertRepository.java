package tn.oliveconnect.dao;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import tn.oliveconnect.entity.Alert;
import tn.oliveconnect.entity.AlertStatus;

public interface AlertRepository extends MongoRepository<Alert, String> {

  Page<Alert> findByStatus(AlertStatus status, Pageable pageable);

  Page<Alert> findByFarmerId(String farmerId, Pageable pageable);

  List<Alert> findByOrchardId(String orchardId);
}
