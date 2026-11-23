package tn.oliveconnect.service;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import tn.oliveconnect.common.exception.ForbiddenException;
import tn.oliveconnect.common.exception.ResourceNotFoundException;
import tn.oliveconnect.dao.NotificationRepository;
import tn.oliveconnect.dao.UserRepository;
import tn.oliveconnect.entity.Notification;
import tn.oliveconnect.entity.Role;
import tn.oliveconnect.entity.User;
import tn.oliveconnect.security.SecurityContextHelper;

@Service
public class NotificationService {

  private final NotificationRepository notificationRepository;
  private final UserRepository userRepository;

  public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
    this.notificationRepository = notificationRepository;
    this.userRepository = userRepository;
  }

  public Page<Notification> findAll(Pageable pageable) {
    return notificationRepository.findByUserIdOrderByCreatedAtDesc(SecurityContextHelper.currentUserId(), pageable);
  }

  public long unreadCount() {
    return notificationRepository.countByUserIdAndReadFalse(SecurityContextHelper.currentUserId());
  }

  public Notification markRead(String id) {
    Notification notification = notificationRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Notification", id));
    if (!notification.getUserId().equals(SecurityContextHelper.currentUserId())) {
      throw new ForbiddenException("Notification belongs to another user");
    }
    notification.setRead(true);
    return notificationRepository.save(notification);
  }

  public Notification notifyUser(String userId, String title, String message, String relatedEntityId) {
    return notificationRepository.save(Notification.builder()
        .userId(userId)
        .title(title)
        .message(message)
        .relatedEntityId(relatedEntityId)
        .build());
  }

  public void notifyRole(Role role, String title, String message, String relatedEntityId) {
    for (User user : userRepository.findByRoleIn(List.of(role))) {
      notifyUser(user.getId(), title, message, relatedEntityId);
    }
  }
}
