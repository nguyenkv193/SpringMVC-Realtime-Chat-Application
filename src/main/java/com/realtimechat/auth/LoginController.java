package com.realtimechat.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.ui.Model;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LoginController {

    @GetMapping("/login")
    public String loginPage(HttpServletRequest request, Model model) {
        HttpSession session = request.getSession(false);
        if (session != null
                && Boolean.TRUE.equals(session.getAttribute(
                LoginAuthenticationFailureHandler.LOGIN_ERROR_SESSION_ATTRIBUTE))) {
            session.removeAttribute(LoginAuthenticationFailureHandler.LOGIN_ERROR_SESSION_ATTRIBUTE);
            model.addAttribute("loginError", true);
        }

        return "auth/login";
    }
}
