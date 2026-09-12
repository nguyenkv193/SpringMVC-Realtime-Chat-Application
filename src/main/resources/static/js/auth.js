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

    var authErrorMessages = document.querySelectorAll('[data-auth-error-message]');
    if (authErrorMessages.length > 0) {
        var messages = Array.prototype.map.call(authErrorMessages, function (errorElement) {
            return errorElement.textContent.trim();
        }).filter(function (message) {
            return message.length > 0;
        });

        var uniqueMessages = messages.filter(function (message, index) {
            return messages.indexOf(message) === index;
        });

        if (typeof window.Toastify === 'function') {
            var toastContent = document.createElement('div');
            toastContent.className = 'moji-toast-content';

            var icon = document.createElement('span');
            icon.className = 'moji-toast-icon';
            icon.setAttribute('aria-hidden', 'true');
            icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">'
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
                className: 'moji-toast',
                offset: {x: 20, y: 20}
            }).showToast();

            document.querySelectorAll('[data-auth-error-container]').forEach(function (errorContainer) {
                errorContainer.remove();
            });
        } else {
            document.querySelectorAll('[data-auth-error-container]').forEach(function (errorContainer) {
                if (errorContainer.hidden) {
                    errorContainer.hidden = false;
                    errorContainer.classList.remove('sr-only');
                    errorContainer.classList.add('auth-alert', 'auth-alert--error');
                }
            });
        }
    }
})();
