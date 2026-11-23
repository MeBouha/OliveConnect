package tn.oliveconnect.dao;

import java.util.List;
import java.util.Optional;
import org.springframework.data.mongodb.repository.MongoRepository;
import tn.oliveconnect.entity.User;

public interface UserRepository extends MongoRepository<User, String> {

  Optional<User> findByEmail(String email);

  boolean existsByEmail(String email);

  List<User> findByRoleIn(List<tn.oliveconnect.entity.Role> roles);
}
