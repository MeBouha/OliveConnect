package tn.oliveconnect.service;

import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import tn.oliveconnect.common.exception.ConflictException;
import tn.oliveconnect.common.exception.ResourceNotFoundException;
import tn.oliveconnect.dao.HarvestRepository;
import tn.oliveconnect.dao.PressReceiptRepository;
import tn.oliveconnect.dao.PressRepository;
import tn.oliveconnect.dto.PressCapacityRequest;
import tn.oliveconnect.dto.PressReceiptRequest;
import tn.oliveconnect.entity.Harvest;
import tn.oliveconnect.entity.HarvestStatus;
import tn.oliveconnect.entity.Press;
import tn.oliveconnect.entity.PressReceipt;
import tn.oliveconnect.mapper.DomainMapper;
import tn.oliveconnect.security.SecurityContextHelper;

@Service
public class PressService {

  private final PressRepository pressRepository;
  private final PressReceiptRepository receiptRepository;
  private final HarvestRepository harvestRepository;
  private final NotificationService notificationService;
  private final DomainMapper mapper;

  public PressService(PressRepository pressRepository, PressReceiptRepository receiptRepository,
      HarvestRepository harvestRepository, NotificationService notificationService, DomainMapper mapper) {
    this.pressRepository = pressRepository;
    this.receiptRepository = receiptRepository;
    this.harvestRepository = harvestRepository;
    this.notificationService = notificationService;
    this.mapper = mapper;
  }

  public List<Press> findAll() {
    return pressRepository.findAllByOrderByNameAsc();
  }

  public Press findById(String id) {
    return pressRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Press", id));
  }

  public PressReceipt createReceipt(String pressId, PressReceiptRequest request) {
    Press press = findById(pressId);
    Harvest harvest = harvestRepository.findById(request.getHarvestId())
        .orElseThrow(() -> new ResourceNotFoundException("Harvest", request.getHarvestId()));
    if (!receiptRepository.findByHarvestId(harvest.getId()).isEmpty()) {
      throw new ConflictException("A receipt already exists for this harvest");
    }
    double newLoad = press.getCurrentLoadKg() + request.getWeightKg();
    if (newLoad > press.getCapacityKgPerDay()) {
      throw new ConflictException("Daily press capacity exceeded");
    }

    PressReceipt receipt = mapper.toEntity(request, pressId, SecurityContextHelper.currentUserId());
    PressReceipt saved = receiptRepository.save(receipt);

    press.setCurrentLoadKg(newLoad);
    press.setLastUpdated(Instant.now());
    pressRepository.save(press);

    harvest.setQuantityKg(request.getWeightKg());
    harvest.setStatus(HarvestStatus.COMPLETED);
    harvestRepository.save(harvest);

    notificationService.notifyUser(harvest.getFarmerId(), "Réception au pressoir",
        "Votre récolte a été reçue avec un poids de " + request.getWeightKg() + " kg", harvest.getId());
    return saved;
  }

  public Press updateCapacity(String pressId, PressCapacityRequest request) {
    Press press = findById(pressId);
    if (request.getCapacityKgPerDay() != null) {
      press.setCapacityKgPerDay(request.getCapacityKgPerDay());
    }
    if (request.getCurrentLoadKg() != null) {
      press.setCurrentLoadKg(request.getCurrentLoadKg());
    }
    press.setLastUpdated(Instant.now());
    return pressRepository.save(press);
  }
}
