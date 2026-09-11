package com.realtimechat.user.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserRequest {

    @Size(min = 5, message = "Username phải tối thiểu 5 ký tự")
    private String username;
}