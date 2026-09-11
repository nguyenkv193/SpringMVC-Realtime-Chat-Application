package com.realtimechat.user.mapper;

import com.realtimechat.user.dto.request.CreateUserRequest;
import com.realtimechat.user.dto.response.UserResponse;
import com.realtimechat.user.entity.User;

public class UserMapper {
    public static User toUser(CreateUserRequest createUserRequest) {
        return User.builder()
                .username(createUserRequest.getUsername())
                .email(createUserRequest.getEmail())
                .password(createUserRequest.getPassword())
                .build();
    }

    public static UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
