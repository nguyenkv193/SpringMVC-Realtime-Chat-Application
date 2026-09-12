package com.realtimechat.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ForgotPasswordRequest {

    @NotBlank(message = "Please enter your email address.")
    @Email(message = "Please enter a valid email address.")
    private String email;
}
