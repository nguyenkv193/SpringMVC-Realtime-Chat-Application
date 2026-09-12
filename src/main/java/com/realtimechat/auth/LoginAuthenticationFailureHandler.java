package com.realtimechat.auth;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.DefaultRedirectStrategy;
import org.springframework.security.web.RedirectStrategy;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class LoginAuthenticationFailureHandler implements AuthenticationFailureHandler {

    public static final String LOGIN_ERROR_SESSION_ATTRIBUTE =
            LoginAuthenticationFailureHandler.class.getName() + ".LOGIN_ERROR";

    private final RedirectStrategy redirectStrategy = new DefaultRedirectStrategy();

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException, ServletException {
        request.getSession(true).setAttribute(LOGIN_ERROR_SESSION_ATTRIBUTE, Boolean.TRUE);
        redirectStrategy.sendRedirect(request, response, "/login");
    }
}
