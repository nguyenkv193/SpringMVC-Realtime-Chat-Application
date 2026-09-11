package com.realtimechat.user.service;

import com.realtimechat.user.dto.request.ChangePasswordRequest;
import com.realtimechat.user.dto.request.CreateUserRequest;
import com.realtimechat.user.dto.request.UpdateUserRequest;
import com.realtimechat.user.dto.response.UserResponse;

public interface UserService {
    UserResponse register(CreateUserRequest createUserRequest);

    UserResponse getCurrentUser(String username);

    UserResponse updateProfile(
            String username,
            UpdateUserRequest request
    );

    void changePassword(
            String username,
            ChangePasswordRequest request
    );

}
