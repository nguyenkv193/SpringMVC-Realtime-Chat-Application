package com.realtimechat.chat.controller;

import com.realtimechat.chat.dto.request.CreateDirectRoomRequest;
import com.realtimechat.chat.dto.request.SendMessageRequest;
import com.realtimechat.chat.dto.response.ChatRoomResponse;
import com.realtimechat.chat.dto.response.MessageResponse;
import com.realtimechat.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatRestController {

    private final ChatService chatService;

    @GetMapping("/rooms")
    public List<ChatRoomResponse> getMyRooms(
            Authentication authentication
    ) {
        return chatService.getMyRooms(authentication.getName());
    }

    @PostMapping("/rooms/direct")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatRoomResponse createDirectRoom(
            Authentication authentication,
            @Valid @RequestBody CreateDirectRoomRequest request
    ) {
        return chatService.createDirectRoom(
                authentication.getName(),
                request
        );
    }

    @GetMapping("/rooms/{roomId}/messages")
    public List<MessageResponse> getMessages(
            Authentication authentication,
            @PathVariable Long roomId
    ) {
        return chatService.getMessages(
                authentication.getName(),
                roomId
        );
    }

    @PostMapping("/rooms/{roomId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponse sendMessage(
            Authentication authentication,
            @PathVariable Long roomId,
            @Valid @RequestBody SendMessageRequest request
    ) {
        return chatService.sendMessage(
                authentication.getName(),
                roomId,
                request
        );
    }
}
