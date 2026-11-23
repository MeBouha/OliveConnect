package tn.oliveconnect.dao;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import tn.oliveconnect.entity.MaturityReading;

public interface MaturityReadingRepository extends MongoRepository<MaturityReading, String> {

  Optional<MaturityReading> findTopByOrchardIdOrderByRecordedAtDesc(String orchardId);

  List<MaturityReading> findByOrchardIdOrderByRecordedAtDesc(String orchardId);

  List<MaturityReading> findByRecordedAtAfter(Instant recordedAt);
}
