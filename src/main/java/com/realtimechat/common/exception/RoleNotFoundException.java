package com.realtimechat.common.exception;

public class RoleNotFoundException extends IllegalStateException {

    public RoleNotFoundException(String roleName) {
        super("Role không tồn tại: " + roleName);
    }
}
