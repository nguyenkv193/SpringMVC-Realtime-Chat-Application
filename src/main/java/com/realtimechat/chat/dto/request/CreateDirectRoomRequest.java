package com.realtimechat.chat.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDirectRoomRequest(

        @NotBlank(message = "{validation.chat.username.required}")
        @Size(max = 50)
        String username
) {
}
