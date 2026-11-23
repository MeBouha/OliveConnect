package tn.oliveconnect.dao;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import tn.oliveconnect.entity.Orchard;

public interface OrchardRepository extends MongoRepository<Orchard, String>, OrchardRepositoryCustom {

  Page<Orchard> findByFarmerId(String farmerId, Pageable pageable);

  List<Orchard> findByFarmerId(String farmerId);
}
