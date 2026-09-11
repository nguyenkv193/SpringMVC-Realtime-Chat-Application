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
})();
