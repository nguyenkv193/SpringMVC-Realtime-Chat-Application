package com.realtimechat.chat.dto.response;

import com.realtimechat.chat.entity.MessageType;

import java.time.Instant;

public record MessageResponse(
        Long id,
        Long roomId,
        Long senderId,
        String senderUsername,
        String senderAvatarUrl,
        String content,
        MessageType messageType,
        Instant sentAt
) {
}
