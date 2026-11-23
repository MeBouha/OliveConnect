package tn.oliveconnect.entity;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
@CompoundIndex(name = "userId_1_read_1_createdAt_-1", def = "{'userId': 1, 'read': 1, 'createdAt': -1}")
public class Notification {

  @Id
  private String id;

  private String userId;
  private String title;
  private String message;

  @Builder.Default
  private boolean read = false;

  @Indexed(name = "createdAt_1", expireAfterSeconds = 7776000)
  @Builder.Default
  private Instant createdAt = Instant.now();

  private String relatedEntityId;
}
