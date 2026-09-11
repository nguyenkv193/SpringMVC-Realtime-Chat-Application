package com.realtimechat.auth;

import com.realtimechat.user.dto.request.CreateUserRequest;
import com.realtimechat.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequiredArgsConstructor
@RequestMapping("/register")
public class RegistrationController {

    private final UserService userService;

    @GetMapping
    public String registerPage() {
        return "auth/register";
    }

    @PostMapping
    public String register(
            @Valid @ModelAttribute("createUserRequest") CreateUserRequest request,
            BindingResult bindingResult
    ) {
        if (bindingResult.hasErrors()) {
            return "auth/register";
        }

        try {
            userService.register(request);
            return "redirect:/login?registered=true";
        } catch (IllegalArgumentException exception) {
            bindingResult.reject("register", exception.getMessage());
            return "auth/register";
        }
    }
}
