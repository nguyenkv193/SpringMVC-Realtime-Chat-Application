(function () {
    'use strict';

    var app = document.querySelector('[data-chat-app]');
    if (!app) {
        return;
    }

    var searchInput = document.querySelector('[data-search]');
    var conversationItems = Array.prototype.slice.call(document.querySelectorAll('[data-conversation]'));
    var emptyState = document.querySelector('[data-conversation-empty]');
    var liveRegion = document.querySelector('[data-live-region]');
    var modal = document.querySelector('[data-new-chat-modal]');
    var modalInput = document.querySelector('#new-chat-person');
    var messageInput = document.querySelector('[data-message-input]');
    var messageThread = document.querySelector('.message-thread');
    var chatScroll = document.querySelector('[data-chat-scroll]');
    var composer = document.querySelector('[data-composer]');
    var preview = document.querySelector('[data-reply-preview]');

    var announce = function (message) {
        if (!liveRegion) {
            return;
        }
        liveRegion.textContent = '';
        window.setTimeout(function () {
            liveRegion.textContent = message;
        }, 20);
    };

    var closeSidebar = function () {
        app.classList.remove('sidebar-open');
        var menuButton = document.querySelector('[data-action="toggle-sidebar"]');
        if (menuButton) {
            menuButton.setAttribute('aria-expanded', 'false');
        }
    };

    var toggleSidebar = function () {
        var isOpen = app.classList.toggle('sidebar-open');
        var menuButton = document.querySelector('[data-action="toggle-sidebar"]');
        if (menuButton) {
            menuButton.setAttribute('aria-expanded', String(isOpen));
        }
    };

    var toggleDetails = function (button) {
        var isCollapsed = app.classList.toggle('details-collapsed');
        document.querySelectorAll('[data-action="toggle-details"]').forEach(function (control) {
            control.setAttribute('aria-expanded', String(!isCollapsed));
        });
        announce(isCollapsed ? 'Conversation details hidden.' : 'Conversation details shown.');
    };

    var toggleSection = function (button) {
        var section = button.closest('.details-section');
        if (!section) {
            return;
        }
        var isExpanded = button.getAttribute('aria-expanded') !== 'false';
        button.setAttribute('aria-expanded', String(!isExpanded));
        section.classList.toggle('is-collapsed', isExpanded);
    };

    var applyConversationFilter = function (filter) {
        var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        var visibleCount = 0;

        conversationItems.forEach(function (item) {
            var categories = (item.getAttribute('data-category') || '').split(' ');
            var name = (item.getAttribute('data-name') || '').toLowerCase();
            var matchesFilter = filter === 'all' || categories.indexOf(filter) !== -1;
            var matchesSearch = !query || name.indexOf(query) !== -1 || item.textContent.toLowerCase().indexOf(query) !== -1;
            var isVisible = matchesFilter && matchesSearch;
            item.hidden = !isVisible;
            if (isVisible) {
                visibleCount += 1;
            }
        });

        if (emptyState) {
            emptyState.hidden = visibleCount > 0;
        }
    };

    var activeFilter = 'inbox';

    document.querySelectorAll('[data-filter]').forEach(function (button) {
        button.addEventListener('click', function () {
            activeFilter = button.getAttribute('data-filter') || 'inbox';
            document.querySelectorAll('[data-filter]').forEach(function (navItem) {
                var isActive = navItem === button;
                navItem.classList.toggle('is-active', isActive);
                if (isActive) {
                    navItem.setAttribute('aria-current', 'page');
                } else {
                    navItem.removeAttribute('aria-current');
                }
            });
            applyConversationFilter(activeFilter);
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            applyConversationFilter(activeFilter);
        });
    }

    conversationItems.forEach(function (item) {
        item.addEventListener('click', function () {
            conversationItems.forEach(function (conversation) {
                var isActive = conversation === item;
                conversation.classList.toggle('is-active', isActive);
                conversation.setAttribute('aria-selected', String(isActive));
            });
            announce('Selected conversation with ' + (item.getAttribute('data-name') || 'contact') + '.');
            closeSidebar();
        });
    });

    document.querySelectorAll('[data-action]').forEach(function (control) {
        control.addEventListener('click', function () {
            var action = control.getAttribute('data-action');
            if (action === 'toggle-sidebar') {
                toggleSidebar();
            }
            if (action === 'close-sidebar') {
                closeSidebar();
            }
            if (action === 'toggle-details') {
                toggleDetails(control);
            }
            if (action === 'toggle-section') {
                toggleSection(control);
            }
            if (action === 'new-chat') {
                openModal();
            }
            if (action === 'close-new-chat') {
                closeModal();
            }
            if (action === 'start-new-chat') {
                startNewChat();
            }
            if (action === 'dismiss-preview' && preview) {
                preview.hidden = true;
            }
        });
    });

    var openModal = function () {
        if (!modal) {
            return;
        }
        modal.hidden = false;
        document.body.classList.add('modal-open');
        if (modalInput) {
            modalInput.value = '';
            window.setTimeout(function () {
                modalInput.focus();
            }, 30);
        }
    };

    var closeModal = function () {
        if (!modal) {
            return;
        }
        modal.hidden = true;
        document.body.classList.remove('modal-open');
    };

    var startNewChat = function () {
        var recipient = modalInput ? modalInput.value.trim() : '';
        if (!recipient) {
            if (modalInput) {
                modalInput.focus();
            }
            announce('Enter a name or email to continue.');
            return;
        }
        closeModal();
        if (preview) {
            preview.hidden = false;
        }
        announce('New conversation preview started for ' + recipient + '.');
    };

    var resizeMessageInput = function () {
        if (!messageInput) {
            return;
        }
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 110) + 'px';
    };

    var createOutgoingMessage = function (message) {
        var row = document.createElement('li');
        row.className = 'message-row message-row--outgoing';

        var stack = document.createElement('div');
        stack.className = 'message-stack';

        var bubble = document.createElement('div');
        bubble.className = 'message-bubble message-bubble--outgoing';
        bubble.textContent = message;

        var meta = document.createElement('div');
        meta.className = 'message-author-line message-author-line--outgoing';
        meta.innerHTML = '<time>Just now · Sending</time>';

        stack.appendChild(bubble);
        stack.appendChild(meta);
        row.appendChild(stack);
        return row;
    };

    if (messageInput) {
        messageInput.addEventListener('input', resizeMessageInput);
        messageInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                if (composer) {
                    composer.requestSubmit();
                }
            }
        });
    }

    if (composer) {
        composer.addEventListener('submit', function (event) {
            event.preventDefault();
            var message = messageInput ? messageInput.value.trim() : '';
            if (!message || !messageThread) {
                return;
            }
            messageThread.appendChild(createOutgoingMessage(message));
            messageInput.value = '';
            resizeMessageInput();
            if (chatScroll) {
                chatScroll.scrollTo({top: chatScroll.scrollHeight, behavior: 'smooth'});
            }
            announce('Message added to the preview.');
        });
    }

    document.addEventListener('keydown', function (event) {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            openModal();
        }
        if (event.key === '/' && document.activeElement !== searchInput && document.activeElement !== messageInput) {
            event.preventDefault();
            if (searchInput) {
                searchInput.focus();
            }
        }
        if (event.key === 'Escape') {
            closeModal();
            closeSidebar();
        }
    });

    applyConversationFilter(activeFilter);
}());
