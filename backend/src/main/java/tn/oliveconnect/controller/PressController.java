package tn.oliveconnect.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tn.oliveconnect.dto.PressCapacityRequest;
import tn.oliveconnect.dto.PressReceiptRequest;
import tn.oliveconnect.entity.Press;
import tn.oliveconnect.entity.PressReceipt;
import tn.oliveconnect.service.PressService;

@RestController
@RequestMapping("/api/presses")
@Tag(name = "Presses")
public class PressController {

  private final PressService pressService;

  public PressController(PressService pressService) {
    this.pressService = pressService;
  }

  @GetMapping
  public List<Press> findAll() {
    return pressService.findAll();
  }

  @PostMapping("/{id}/receipts")
  @PreAuthorize("hasAnyRole('PRESS_MANAGER','ADMIN')")
  public PressReceipt createReceipt(@PathVariable String id, @Valid @RequestBody PressReceiptRequest request) {
    return pressService.createReceipt(id, request);
  }

  @PatchMapping("/{id}/capacity")
  @PreAuthorize("hasAnyRole('PRESS_MANAGER','ADMIN')")
  public Press updateCapacity(@PathVariable String id, @Valid @RequestBody PressCapacityRequest request) {
    return pressService.updateCapacity(id, request);
  }
}
