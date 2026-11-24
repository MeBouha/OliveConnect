package tn.oliveconnect.security;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class JwtPropertiesTest {

  @Test
  void rejectsMissingSecret() {
    JwtProperties properties = new JwtProperties();
    assertThatThrownBy(properties::validate).isInstanceOf(IllegalStateException.class);
  }

  @Test
  void rejectsShortSecret() {
    JwtProperties properties = new JwtProperties();
    properties.setSecret("too-short");
    assertThatThrownBy(properties::validate).isInstanceOf(IllegalStateException.class);
  }

  @Test
  void acceptsStrongSecret() {
    JwtProperties properties = new JwtProperties();
    properties.setSecret("x".repeat(JwtProperties.MIN_SECRET_BYTES));
    assertThatCode(properties::validate).doesNotThrowAnyException();
  }
}
