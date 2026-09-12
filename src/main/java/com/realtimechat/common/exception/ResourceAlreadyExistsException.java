package com.realtimechat.common.exception;

public class ResourceAlreadyExistsException extends IllegalArgumentException {

    public ResourceAlreadyExistsException(String message) {
        super(message);
    }
}
