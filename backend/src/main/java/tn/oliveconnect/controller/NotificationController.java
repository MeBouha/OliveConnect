package tn.oliveconnect.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import tn.oliveconnect.common.web.PageRequests;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tn.oliveconnect.common.dto.PageResponse;
import tn.oliveconnect.entity.Notification;
import tn.oliveconnect.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications")
public class NotificationController {

  private final NotificationService notificationService;

  public NotificationController(NotificationService notificationService) {
    this.notificationService = notificationService;
  }

  @GetMapping
  public PageResponse<Notification> findAll(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Pageable pageable = PageRequests.of(page, size);
    Page<Notification> result = notificationService.findAll(pageable);
    return PageResponse.of(result);
  }

  @PatchMapping("/{id}/read")
  public Notification markRead(@PathVariable String id) {
    return notificationService.markRead(id);
  }
}
