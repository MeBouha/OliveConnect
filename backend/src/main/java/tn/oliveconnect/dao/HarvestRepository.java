package tn.oliveconnect.dao;

import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import tn.oliveconnect.entity.Harvest;
import tn.oliveconnect.entity.HarvestStatus;

public interface HarvestRepository extends MongoRepository<Harvest, String> {

  Page<Harvest> findByFarmerId(String farmerId, Pageable pageable);

  List<Harvest> findByTourId(String tourId);

  List<Harvest> findByOrchardIdOrderByRequestedDateDesc(String orchardId);

  long countByStatusIn(List<HarvestStatus> statuses);

  List<Harvest> findByPlannedDateBetween(Instant from, Instant to);
}
