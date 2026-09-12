package com.realtimechat.user.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUserRequest {
    @NotBlank(message = "{validation.username.required}")
    @Size(min = 5, message = "{validation.username.size}")
    private String username;

    @NotBlank(message = "{validation.email.required}")
    @Email(message = "{validation.email.invalid}")
    private String email;

    @NotBlank(message = "{validation.password.required}")
    @Size(min = 6, message = "{validation.password.size}")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).+$",
            message = "{validation.password.pattern}"
    )
    private String password;

    @NotBlank(message = "{validation.confirmPassword.required}")
    @Size(min = 6, message = "{validation.confirmPassword.size}")
    private String confirmPassword;

    @AssertTrue(message = "{validation.password.mismatch}")
    public boolean isPasswordMatched() {
        return password != null && confirmPassword != null && password.equals(confirmPassword);
    }
}
