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
@Document(collection = "import_logs")
public class ImportLog {

  @Id
  private String id;

  private String source;
  private int recordsImported;
  private int recordsRejected;
  @Indexed(name = "startedAt_1", expireAfterSeconds = 15552000)
  private Instant startedAt;

  private Instant finishedAt;

  private ImportStatus status;
}
