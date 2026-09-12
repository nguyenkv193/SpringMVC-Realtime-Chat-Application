package com.realtimechat.chat.service;

import com.realtimechat.chat.dto.request.CreateDirectRoomRequest;
import com.realtimechat.chat.dto.request.SendMessageRequest;
import com.realtimechat.chat.dto.response.ChatRoomResponse;
import com.realtimechat.chat.dto.response.MessageResponse;

import java.util.List;

public interface ChatService {

    List<ChatRoomResponse> getMyRooms(String username);

    List<MessageResponse> getMessages(
            String username,
            Long roomId
    );

    void assertRoomMember(
            String username,
            Long roomId
    );

    ChatRoomResponse createDirectRoom(
            String username,
            CreateDirectRoomRequest request
    );

    MessageResponse sendMessage(
            String username,
            Long roomId,
            SendMessageRequest request
    );
}
