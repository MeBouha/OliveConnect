package tn.oliveconnect.dao;

import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import tn.oliveconnect.entity.Tour;
import tn.oliveconnect.entity.TourStatus;

public interface TourRepository extends MongoRepository<Tour, String> {

  List<Tour> findByCode(String code);

  Page<Tour> findByPlannedDateBetween(Instant from, Instant to, Pageable pageable);

  Page<Tour> findByStatus(TourStatus status, Pageable pageable);

  Page<Tour> findByTeamLeaderId(String teamLeaderId, Pageable pageable);

  List<Tour> findByStatusAndPlannedDateBefore(TourStatus status, Instant date);
}
