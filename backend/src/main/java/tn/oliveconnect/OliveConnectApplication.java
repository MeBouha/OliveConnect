package tn.oliveconnect;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@SpringBootApplication
@EnableMethodSecurity
@EnableScheduling
public class OliveConnectApplication {

  public static void main(String[] args) {
    SpringApplication.run(OliveConnectApplication.class, args);
  }
}
