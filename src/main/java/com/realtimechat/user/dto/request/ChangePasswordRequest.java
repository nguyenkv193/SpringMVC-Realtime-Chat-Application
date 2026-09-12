package com.realtimechat.user.dto.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangePasswordRequest {

    @NotBlank(message = "{validation.currentPassword.required}")
    private String oldPassword;

    @NotBlank(message = "{validation.newPassword.required}")
    @Size(min = 6, message = "{validation.password.size}")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).+$",
            message = "{validation.password.pattern}"
    )
    private String newPassword;

    @NotBlank(message = "{validation.confirmNewPassword.required}")
    @Size(min = 6, message = "{validation.password.size}")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).+$",
            message = "{validation.password.pattern}"
    )
    private String confirmPassword;

    @AssertTrue(message = "{validation.password.mismatch}")
    public boolean isPasswordMatched() {
        return newPassword != null &&
                confirmPassword != null &&
                newPassword.equals(confirmPassword);
    }
}
