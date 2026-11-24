package tn.oliveconnect.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import tn.oliveconnect.common.web.PageRequests;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import tn.oliveconnect.common.dto.PageResponse;
import tn.oliveconnect.dto.AdminStatusView;
import tn.oliveconnect.dto.ImportTriggerRequest;
import tn.oliveconnect.dto.RoleUpdateRequest;
import tn.oliveconnect.entity.Role;
import tn.oliveconnect.entity.User;
import tn.oliveconnect.service.AdminService;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Administration")
public class AdminController {

  private final AdminService adminService;

  public AdminController(AdminService adminService) {
    this.adminService = adminService;
  }

  @GetMapping("/users")
  public PageResponse<User> users(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Pageable pageable = PageRequests.of(page, size);
    Page<User> result = adminService.findUsers(pageable);
    return PageResponse.of(result);
  }

  @PatchMapping("/users/{id}/role")
  public User updateRole(@PathVariable String id, @Valid @RequestBody RoleUpdateRequest request) {
    return adminService.updateRole(id, request.getRole());
  }

  @PostMapping("/imports/trigger")
  @ResponseStatus(HttpStatus.ACCEPTED)
  public void triggerImport(@Valid @RequestBody ImportTriggerRequest request) {
    adminService.triggerImport(request);
  }

  @GetMapping("/status")
  public AdminStatusView status() {
    return adminService.status();
  }
}
