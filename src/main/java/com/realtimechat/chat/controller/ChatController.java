package com.realtimechat.chat.controller;

import com.realtimechat.user.dto.response.UserResponse;
import com.realtimechat.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
public class ChatController {
    private final UserService userService;

    @GetMapping("/chat")
    public String chatPage(
            Authentication authentication,
            Model model
    ) {
        UserResponse currentUser = userService.getCurrentUser(
                authentication.getName()
        );

        model.addAttribute(
                "currentUsername",
                currentUser.getUsername()
        );
        model.addAttribute(
                "currentUserAvatarUrl",
                currentUser.getAvatarUrl()
        );

        return "chat/chat";
    }
}
