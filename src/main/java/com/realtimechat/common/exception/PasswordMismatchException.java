package com.realtimechat.common.exception;

public class PasswordMismatchException extends IllegalArgumentException {

    public PasswordMismatchException(String message) {
        super(message);
    }
}
