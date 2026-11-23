package tn.oliveconnect.dao;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.oliveconnect.entity.ImportLog;

public interface ImportLogRepository extends MongoRepository<ImportLog, String> {
}
