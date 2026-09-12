package com.realtimechat.chat.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendMessageRequest(

        @NotBlank(message = "{validation.chat.content.required}")
        @Size(
                max = 5000,
                message = "{validation.chat.content.size}"
        )
        String content
) {
}
