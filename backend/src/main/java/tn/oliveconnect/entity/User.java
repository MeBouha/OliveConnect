package tn.oliveconnect.entity;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

  @Id
  private String id;

  @Indexed(unique = true, name = "email_1")
  private String email;

  private String passwordHash;
  private String fullName;
  private String phone;
  private Role role;

  @Builder.Default
  private boolean active = true;

  @Builder.Default
  private Instant createdAt = Instant.now();
}
