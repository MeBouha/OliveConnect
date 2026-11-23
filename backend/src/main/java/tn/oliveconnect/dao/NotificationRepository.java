package tn.oliveconnect.dao;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import tn.oliveconnect.entity.Notification;

public interface NotificationRepository extends MongoRepository<Notification, String> {

  Page<Notification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

  long countByUserIdAndReadFalse(String userId);

  List<Notification> findByUserIdAndReadFalse(String userId);
}
