package com.realtimechat.user.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUserRequest {
    @NotBlank(message = "Username không được để trống")
    @Size(min = 5, message = "Username phải tối thiểu 5 ký tự")
    private String username;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ, vui lòng nhập lại")
    private String email;

    @NotBlank(message = "Password không được để trống")
    @Size(min = 6, message = "Mật khẩu phải tối thiếu 6 ký tự")
    @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).+$",
            message = "Mật khẩu phải có chữ thường, chữ hoa, số và ký tự đặc biệt"
    )
    private String password;
}
