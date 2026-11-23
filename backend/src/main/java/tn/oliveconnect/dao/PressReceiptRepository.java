package tn.oliveconnect.dao;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import tn.oliveconnect.entity.PressReceipt;

public interface PressReceiptRepository extends MongoRepository<PressReceipt, String> {

  List<PressReceipt> findByPressId(String pressId);

  List<PressReceipt> findByHarvestId(String harvestId);
}
