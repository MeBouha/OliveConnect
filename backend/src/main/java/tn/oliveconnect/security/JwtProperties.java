package tn.oliveconnect.security;

import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

  /** HMAC-SHA256 requires a key of at least 256 bits. */
  static final int MIN_SECRET_BYTES = 32;

  private String secret;
  private long expirationMs = 86400000L;

  @PostConstruct
  void validate() {
    if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
      throw new IllegalStateException("JWT_SECRET must be set to at least " + MIN_SECRET_BYTES
          + " bytes (e.g. `openssl rand -base64 48`). Use `./mvnw spring-boot:run` for the dev profile.");
    }
  }
}
