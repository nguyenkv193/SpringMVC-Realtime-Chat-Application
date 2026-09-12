package com.realtimechat.chat.dto.response;

public record TypingEvent(
        Long roomId,
        String username,
        boolean typing
) {
}
