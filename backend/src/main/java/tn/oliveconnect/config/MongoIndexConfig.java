package tn.oliveconnect.config;

import java.util.concurrent.TimeUnit;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.bson.Document;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexDefinition;
import org.springframework.data.mongodb.core.index.IndexOperations;

@Configuration
public class MongoIndexConfig {

  private static final Logger log = LogManager.getLogger(MongoIndexConfig.class);

  @Bean
  @Order(1)
  public ApplicationRunner ensureMongoIndexes(MongoTemplate mongoTemplate) {
    return args -> {
      ensure(mongoTemplate, "users", asc("email").unique().named("email_1"), "email_1");
      ensure(mongoTemplate, "orchards", geo("geometry", "geometry_2dsphere"), "geometry_2dsphere");
      ensure(mongoTemplate, "orchards", asc("farmerId").named("farmerId_1"), "farmerId_1");
      ensure(mongoTemplate, "maturity_readings",
          compound("orchardId_1_recordedAt_-1", new Document("orchardId", 1).append("recordedAt", -1)),
          "orchardId_1_recordedAt_-1");
      ensure(mongoTemplate, "harvests",
          compound("farmerId_1_status_1", new Document("farmerId", 1).append("status", 1)),
          "farmerId_1_status_1");
      ensure(mongoTemplate, "harvests", asc("orchardId").named("orchardId_1"), "orchardId_1");
      ensure(mongoTemplate, "harvests", asc("plannedDate").named("plannedDate_1"), "plannedDate_1");
      ensure(mongoTemplate, "harvests", asc("status").named("status_1"), "status_1");
      ensure(mongoTemplate, "alerts", geo("location", "location_2dsphere"), "location_2dsphere");
      ensure(mongoTemplate, "alerts",
          compound("status_1_createdAt_-1", new Document("status", 1).append("createdAt", -1)),
          "status_1_createdAt_-1");
      ensure(mongoTemplate, "tours", asc("code").unique().named("code_1"), "code_1");
      ensure(mongoTemplate, "tours", asc("plannedDate").named("plannedDate_1"), "plannedDate_1");
      ensure(mongoTemplate, "tours", asc("status").named("status_1"), "status_1");
      ensure(mongoTemplate, "tours", asc("teamLeaderId").named("teamLeaderId_1"), "teamLeaderId_1");
      ensure(mongoTemplate, "resources",
          compound("type_1_status_1", new Document("type", 1).append("status", 1)), "type_1_status_1");
      ensure(mongoTemplate, "notifications",
          compound("userId_1_read_1_createdAt_-1",
              new Document("userId", 1).append("read", 1).append("createdAt", -1)),
          "userId_1_read_1_createdAt_-1");
      ensure(mongoTemplate, "notifications",
          asc("createdAt").expire(90, TimeUnit.DAYS).named("createdAt_1"), "createdAt_1");
      ensure(mongoTemplate, "press_receipts",
          compound("pressId_1_receivedAt_1", new Document("pressId", 1).append("receivedAt", 1)),
          "pressId_1_receivedAt_1");
      ensure(mongoTemplate, "press_receipts", asc("harvestId").named("harvestId_1"), "harvestId_1");
      ensure(mongoTemplate, "import_logs",
          asc("startedAt").expire(180, TimeUnit.DAYS).named("startedAt_1"), "startedAt_1");
      log.info("MongoDB index verification completed for OliveConnect collections");
    };
  }

  private void ensure(MongoTemplate mongoTemplate, String collection, IndexDefinition definition, String name) {
    IndexOperations operations = mongoTemplate.indexOps(collection);
    operations.ensureIndex(definition);
    log.info("MongoDB index ensured: {}.{}", collection, name);
  }

  private Index asc(String field) {
    return new Index().on(field, Sort.Direction.ASC);
  }

  private IndexDefinition geo(String field, String name) {
    return new CompoundIndexDefinition(new Document(field, "2dsphere")).named(name);
  }

  private IndexDefinition compound(String name, Document keys) {
    return new CompoundIndexDefinition(keys).named(name);
  }
}
