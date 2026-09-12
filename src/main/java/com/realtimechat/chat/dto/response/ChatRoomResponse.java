package com.realtimechat.chat.dto.response;

import com.realtimechat.chat.entity.RoomType;

import java.time.Instant;

public record ChatRoomResponse(
        Long id,
        String name,
        RoomType roomType,
        String avatarUrl,
        Instant updatedAt,
        MessageResponse lastMessage
) {
}
