(function () {
    'use strict';

    document.querySelectorAll('[data-password-toggle]').forEach(function (toggle) {
        toggle.addEventListener('click', function () {
            var input = document.getElementById(toggle.dataset.passwordToggle);
            if (!input) {
                return;
            }

            var shouldShow = input.type === 'password';
            input.type = shouldShow ? 'text' : 'password';
            toggle.setAttribute('aria-label', shouldShow ? 'Hide password' : 'Show password');
        });
    });

    var registerForm = document.querySelector('[data-register-form]');
    if (registerForm) {
        var password = registerForm.querySelector('#password');
        var confirmPassword = registerForm.querySelector('#confirmPassword');

        var validatePasswords = function () {
            if (!confirmPassword || !password) {
                return;
            }

            confirmPassword.setCustomValidity(
                password.value === confirmPassword.value ? '' : 'Passwords do not match.'
            );
        };

        password.addEventListener('input', validatePasswords);
        confirmPassword.addEventListener('input', validatePasswords);
    }

    var showToast = function (messageElements, variant, containerSelector) {
        if (messageElements.length === 0) {
            return;
        }

        var messages = Array.prototype.map.call(messageElements, function (messageElement) {
            return messageElement.textContent.trim();
        }).filter(function (message) {
            return message.length > 0;
        });

        var uniqueMessages = messages.filter(function (message, index) {
            return messages.indexOf(message) === index;
        });

        if (uniqueMessages.length === 0) {
            return;
        }

        if (typeof window.Toastify === 'function') {
            var toastContent = document.createElement('div');
            toastContent.className = 'moji-toast-content';

            var icon = document.createElement('span');
            icon.className = 'moji-toast-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.innerHTML = variant === 'success'
                ? '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">'
                    + '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.7"/>'
                    + '<path d="M8 12.2L10.7 15L16.2 9.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">'
                    + '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.7"/>'
                    + '<path d="M12 7.8V12.3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
                    + '<circle cx="12" cy="15.8" r="1" fill="currentColor"/></svg>';

            var copy = document.createElement('span');
            copy.className = 'moji-toast-copy';
            copy.textContent = uniqueMessages.join(' • ');

            toastContent.append(icon, copy);

            window.Toastify({
                node: toastContent,
                duration: 4500,
                gravity: 'bottom',
                position: 'right',
                close: false,
                stopOnFocus: true,
                ariaLive: 'assertive',
                className: 'moji-toast moji-toast--' + variant,
                offset: {x: 20, y: 20}
            }).showToast();

            document.querySelectorAll(containerSelector).forEach(function (messageContainer) {
                messageContainer.remove();
            });
        } else {
            document.querySelectorAll(containerSelector).forEach(function (messageContainer) {
                if (messageContainer.hidden) {
                    messageContainer.hidden = false;
                    messageContainer.classList.remove('sr-only');
                    messageContainer.classList.add('auth-alert', 'auth-alert--' + variant);
                }
            });
        }
    };

    var authErrorMessages = document.querySelectorAll('[data-auth-error-message]');
    showToast(authErrorMessages, 'error', '[data-auth-error-container]');

    var authSuccessMessages = document.querySelectorAll('[data-auth-success-message]');
    showToast(authSuccessMessages, 'success', '[data-auth-success-container]');
})();
