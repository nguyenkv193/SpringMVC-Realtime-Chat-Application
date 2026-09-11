package com.realtimechat.user.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;

    private String username;

    private String email;

    private String avatarUrl;

    private Instant createdAt;

    private Instant updatedAt;
}