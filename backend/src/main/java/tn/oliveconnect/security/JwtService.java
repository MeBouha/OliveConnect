package tn.oliveconnect.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;
import tn.oliveconnect.entity.Role;

@Service
public class JwtService {

  private final JwtProperties properties;

  public JwtService(JwtProperties properties) {
    this.properties = properties;
  }

  public String generateToken(String email, String userId, Role role) {
    Date now = new Date();
    return Jwts.builder()
        .subject(email)
        .claim("userId", userId)
        .claim("role", role.name())
        .issuedAt(now)
        .expiration(new Date(now.getTime() + properties.getExpirationMs()))
        .signWith(signingKey())
        .compact();
  }

  public String extractEmail(String token) {
    return parseClaims(token).getSubject();
  }

  public String extractUserId(String token) {
    return parseClaims(token).get("userId", String.class);
  }

  public Role extractRole(String token) {
    return Role.valueOf(parseClaims(token).get("role", String.class));
  }

  public boolean isTokenValid(String token) {
    try {
      Claims claims = parseClaims(token);
      return claims.getExpiration().after(new Date());
    } catch (JwtException | IllegalArgumentException exception) {
      return false;
    }
  }

  private Claims parseClaims(String token) {
    return Jwts.parser()
        .verifyWith(signingKey())
        .build()
        .parseSignedClaims(token)
        .getPayload();
  }

  private SecretKey signingKey() {
    return Keys.hmacShaKeyFor(properties.getSecret().getBytes(StandardCharsets.UTF_8));
  }
}
