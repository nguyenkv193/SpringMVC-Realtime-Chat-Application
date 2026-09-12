package com.realtimechat.user.service.impl;

import com.realtimechat.auth.ApplicationOidcUser;
import com.realtimechat.common.exception.RoleNotFoundException;
import com.realtimechat.user.entity.AuthProvider;
import com.realtimechat.user.entity.Role;
import com.realtimechat.user.entity.User;
import com.realtimechat.user.repository.RoleRepository;
import com.realtimechat.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoogleOidcUserService extends OidcUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public OidcUser loadUser(OidcUserRequest userRequest)
            throws OAuth2AuthenticationException {
        OidcUser googleUser = super.loadUser(userRequest);

        String googleId = googleUser.getSubject();
        String email = googleUser.getEmail();
        Boolean emailVerified = googleUser.getAttribute("email_verified");

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("missing_email"),
                    "Google account does not provide an email"
            );
        }

        if (!Boolean.TRUE.equals(emailVerified)) {
            throw new OAuth2AuthenticationException(
                    new OAuth2Error("unverified_email"),
                    "Google email is not verified"
            );
        }

        User user = userRepository
                .findByAuthProviderAndProviderId(AuthProvider.GOOGLE, googleId)
                .orElseGet(() -> userRepository.findByEmail(email)
                        .orElseGet(() -> createGoogleUser(email)));

        user.setAuthProvider(AuthProvider.GOOGLE);
        user.setProviderId(googleId);
        user.setEmail(email);
        user.setAvatarUrl(googleUser.getAttribute("picture"));

        if (user.getRoles().isEmpty()) {
            user.getRoles().add(defaultUserRole());
        }

        User savedUser = userRepository.save(user);

        Set<GrantedAuthority> authorities = new HashSet<>(googleUser.getAuthorities());
        savedUser.getRoles().forEach(role -> authorities.add(
                new SimpleGrantedAuthority("ROLE_" + role.getName())
        ));

        OidcUser principal = new DefaultOidcUser(
                authorities,
                googleUser.getIdToken(),
                googleUser.getUserInfo()
        );

        return new ApplicationOidcUser(principal, savedUser.getUsername());
    }

    private User createGoogleUser(String email) {
        return User.builder()
                .username(generateUsername(email))
                .email(email)
                .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                .authProvider(AuthProvider.GOOGLE)
                .build();
    }

    private Role defaultUserRole() {
        return roleRepository.findByName("USER")
                .orElseThrow(() -> new RoleNotFoundException("USER"));
    }

    private String generateUsername(String email) {
        String localPart = email.substring(0, email.indexOf('@'))
                .replaceAll("[^a-zA-Z0-9]", "")
                .toLowerCase(Locale.ROOT);

        if (localPart.length() < 3) {
            localPart = "googleuser";
        }

        String base = "g_" + localPart;
        if (base.length() > 42) {
            base = base.substring(0, 42);
        }

        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            String suffixText = "_" + suffix++;
            int maxBaseLength = 50 - suffixText.length();
            candidate = base.substring(0, Math.min(base.length(), maxBaseLength)) + suffixText;
        }

        return candidate;
    }
}
