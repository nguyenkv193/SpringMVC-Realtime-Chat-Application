package com.realtimechat.user.service.impl;

import com.realtimechat.common.exception.InvalidPasswordException;
import com.realtimechat.common.exception.PasswordMismatchException;
import com.realtimechat.common.exception.ResourceAlreadyExistsException;
import com.realtimechat.common.exception.ResourceNotFoundException;
import com.realtimechat.common.exception.RoleNotFoundException;
import com.realtimechat.user.dto.request.ChangePasswordRequest;
import com.realtimechat.user.dto.request.CreateUserRequest;
import com.realtimechat.user.dto.request.UpdateUserRequest;
import com.realtimechat.user.dto.response.UserResponse;
import com.realtimechat.user.entity.Role;
import com.realtimechat.user.entity.User;
import com.realtimechat.user.mapper.UserMapper;
import com.realtimechat.user.repository.RoleRepository;
import com.realtimechat.user.repository.UserRepository;
import com.realtimechat.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserResponse register(CreateUserRequest createUserRequest) {
        if(userRepository.existsByUsername(createUserRequest.getUsername())) {
            throw new ResourceAlreadyExistsException("error.username.exists");
        }

        if(userRepository.existsByEmail(createUserRequest.getEmail())) {
            throw new ResourceAlreadyExistsException("error.email.exists");
        }

        User user = UserMapper.toUser(createUserRequest);
        user.setPassword(passwordEncoder.encode(createUserRequest.getPassword()));

        Role defaultRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new RoleNotFoundException("USER"));
        user.getRoles().add(defaultRole);

        return UserMapper.toUserResponse(userRepository.save(user));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String username) {
        return UserMapper.toUserResponse(findUserByUsername(username));
    }

    @Override
    public UserResponse updateProfile(String username, UpdateUserRequest request) {
        User user = findUserByUsername(username);

        if(request.getUsername() != null && !request.getUsername().equals(username)) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new ResourceAlreadyExistsException("error.username.exists");
            }

            user.setUsername(username);
        }

        return UserMapper.toUserResponse(userRepository.save(user));
    }

    @Override
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = findUserByUsername(username);

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new InvalidPasswordException("error.password.invalid");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new PasswordMismatchException("error.password.mismatch");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new ResourceNotFoundException("error.user.not-found"));
    }
}
