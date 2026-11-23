package tn.oliveconnect.dao;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import tn.oliveconnect.entity.Resource;
import tn.oliveconnect.entity.ResourceStatus;
import tn.oliveconnect.entity.ResourceType;

public interface ResourceRepository extends MongoRepository<Resource, String> {

  Page<Resource> findByTypeAndStatus(ResourceType type, ResourceStatus status, Pageable pageable);

  List<Resource> findByIdIn(List<String> ids);
}
