package tn.oliveconnect.dao;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import tn.oliveconnect.entity.Press;

public interface PressRepository extends MongoRepository<Press, String> {

  List<Press> findAllByOrderByNameAsc();
}
