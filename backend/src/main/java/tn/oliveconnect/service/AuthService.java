package tn.oliveconnect.service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import tn.oliveconnect.common.exception.ApiException;
import tn.oliveconnect.common.exception.BadRequestException;
import tn.oliveconnect.common.exception.ConflictException;
import tn.oliveconnect.common.exception.ResourceNotFoundException;
import tn.oliveconnect.dao.UserRepository;
import tn.oliveconnect.dto.AuthResponse;
import tn.oliveconnect.dto.LoginRequest;
import tn.oliveconnect.dto.MeResponse;
import tn.oliveconnect.dto.RegisterRequest;
import tn.oliveconnect.entity.Role;
import tn.oliveconnect.entity.User;
import tn.oliveconnect.mapper.UserMapper;
import tn.oliveconnect.security.JwtService;
import tn.oliveconnect.security.SecurityContextHelper;

@Service
public class AuthService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtService jwtService;
  private final UserMapper userMapper;

  public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
      AuthenticationManager authenticationManager, JwtService jwtService, UserMapper userMapper) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.authenticationManager = authenticationManager;
    this.jwtService = jwtService;
    this.userMapper = userMapper;
  }

  public AuthResponse register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
      throw new ConflictException("Email already registered: " + request.getEmail());
    }
    if (request.getRole() != Role.FARMER) {
      throw new BadRequestException("Self-registration is only allowed for FARMER");
    }
    User user = User.builder()
        .email(request.getEmail().toLowerCase())
        .passwordHash(passwordEncoder.encode(request.getPassword()))
        .fullName(request.getFullName())
        .phone(request.getPhone())
        .role(Role.FARMER)
        .active(true)
        .build();
    User saved = userRepository.save(user);
    return tokenResponse(saved);
  }

  public AuthResponse login(LoginRequest request) {
    String email = request.getEmail().toLowerCase();
    try {
      authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(email, request.getPassword()));
    } catch (BadCredentialsException exception) {
      throw new ApiException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ResourceNotFoundException("User", email));
    if (!user.isActive()) {
      throw new ApiException(org.springframework.http.HttpStatus.UNAUTHORIZED, "User account is disabled");
    }
    return tokenResponse(user);
  }

  public MeResponse me() {
    String userId = SecurityContextHelper.currentUserId();
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    return userMapper.toMeResponse(user);
  }

  private AuthResponse tokenResponse(User user) {
    return AuthResponse.builder()
        .token(jwtService.generateToken(user.getEmail(), user.getId(), user.getRole()))
        .role(user.getRole())
        .userId(user.getId())
        .build();
  }
}
