package com.realtimechat.chat.controller;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ChatController {

    @GetMapping("/chat")
    public String chatPage(
            Authentication authentication,
            Model model
    ) {
        model.addAttribute(
                "currentUsername",
                authentication.getName()
        );

        return "chat/chat";
    }
}
