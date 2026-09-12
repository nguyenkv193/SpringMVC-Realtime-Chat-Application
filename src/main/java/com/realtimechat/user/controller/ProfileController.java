package com.realtimechat.user.controller;

import com.realtimechat.common.exception.InvalidPasswordException;
import com.realtimechat.common.exception.PasswordMismatchException;
import com.realtimechat.common.exception.ResourceAlreadyExistsException;
import com.realtimechat.user.dto.request.ChangePasswordRequest;
import com.realtimechat.user.dto.request.UpdateUserRequest;
import com.realtimechat.user.dto.response.UserResponse;
import com.realtimechat.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequiredArgsConstructor
@RequestMapping("/profile")
public class ProfileController {

    private final UserService userService;
    private final MessageSource messageSource;
    private final SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();

    @GetMapping
    public String profile(Authentication authentication, Model model) {
        UserResponse user = userService.getCurrentUser(authentication.getName());

        model.addAttribute("user", user);
        model.addAttribute(
                "updateUserRequest",
                UpdateUserRequest.builder()
                        .username(user.getUsername())
                        .build()
        );

        return "user/profile";
    }

    @PostMapping
    public String updateProfile(
            Authentication authentication,
            @Valid @ModelAttribute("updateUserRequest") UpdateUserRequest request,
            BindingResult bindingResult,
            Model model,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        if (bindingResult.hasErrors()) {
            model.addAttribute("user", userService.getCurrentUser(authentication.getName()));
            return "user/profile";
        }

        try {
            UserResponse updatedUser = userService.updateProfile(authentication.getName(), request);

            if (!authentication.getName().equals(updatedUser.getUsername())) {
                logoutHandler.logout(httpRequest, httpResponse, authentication);
                return "redirect:/login?usernameChanged=true";
            }

            return "redirect:/profile?updated=true";
        } catch (ResourceAlreadyExistsException exception) {
            bindingResult.reject("updateProfile", resolveMessage(exception.getMessage()));
            model.addAttribute("user", userService.getCurrentUser(authentication.getName()));
            return "user/profile";
        }
    }

    @GetMapping("/change-password")
    public String changePasswordPage() {
        return "user/change-password";
    }

    @PostMapping("/change-password")
    public String changePassword(
            Authentication authentication,
            @Valid @ModelAttribute("changePasswordRequest") ChangePasswordRequest request,
            BindingResult bindingResult
    ) {
        if (bindingResult.hasErrors()) {
            return "user/change-password";
        }

        try {
            userService.changePassword(authentication.getName(), request);
            return "redirect:/profile?passwordChanged=true";
        } catch (InvalidPasswordException | PasswordMismatchException exception) {
            bindingResult.reject("changePassword", resolveMessage(exception.getMessage()));
            return "user/change-password";
        }
    }

    private String resolveMessage(String messageCode) {
        return messageSource.getMessage(
                messageCode,
                null,
                messageCode,
                LocaleContextHolder.getLocale()
        );
    }
}
