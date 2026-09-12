package com.realtimechat.chat.controller;

import com.realtimechat.chat.dto.request.TypingRequest;
import com.realtimechat.chat.dto.request.SendMessageRequest;
import com.realtimechat.chat.dto.response.MessageResponse;
import com.realtimechat.chat.dto.response.TypingEvent;
import com.realtimechat.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send/{roomId}")
    public void sendMessage(
            @DestinationVariable Long roomId,
            @Payload SendMessageRequest request,
            Principal principal
    ) {
        if (principal == null) {
            throw new IllegalStateException(
                    "WebSocket user is not authenticated"
            );
        }

        MessageResponse response = chatService.sendMessage(
                principal.getName(),
                roomId,
                request
        );

        messagingTemplate.convertAndSend(
                "/topic/chat/rooms/" + roomId,
                response
        );
    }

    @MessageMapping("/chat.typing/{roomId}")
    public void updateTypingState(
            @DestinationVariable Long roomId,
            @Payload TypingRequest request,
            Principal principal
    ) {
        if (principal == null) {
            throw new IllegalStateException(
                    "WebSocket user is not authenticated"
            );
        }

        chatService.assertRoomMember(principal.getName(), roomId);

        messagingTemplate.convertAndSend(
                "/topic/chat/rooms/" + roomId + "/typing",
                new TypingEvent(
                        roomId,
                        principal.getName(),
                        request != null && request.typing()
                )
        );
    }
}
