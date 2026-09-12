(function () {
    'use strict';

    var app = document.querySelector('[data-chat-app]');
    if (!app) {
        return;
    }

    var body = document.body;
    var mainPanel = document.querySelector('.conversation-panel');
    var conversationList = document.querySelector('[data-conversation-list]');
    var conversationEmpty = document.querySelector('[data-conversation-empty]');
    var searchInput = document.querySelector('[data-search]');
    var chatScroll = document.querySelector('[data-chat-scroll]');
    var messageThread = document.querySelector('[data-message-thread]');
    var chatIntro = document.querySelector('[data-chat-intro]');
    var typingState = document.querySelector('[data-typing-state]');
    var typingLabel = document.querySelector('[data-typing-label]');
    var composer = document.querySelector('[data-composer]');
    var messageInput = document.querySelector('[data-message-input]');
    var sendButton = document.querySelector('.send-button');
    var liveRegion = document.querySelector('[data-live-region]');
    var modal = document.querySelector('[data-new-chat-modal]');
    var modalInput = document.querySelector('#new-chat-person');
    var accountAvatar = document.querySelector('[data-account-avatar]');

    var rooms = [];
    var currentRoom = null;
    var currentRoomId = null;
    var roomSubscription = null;
    var typingSubscription = null;
    var stompClient = null;
    var remoteTypingTimer = null;
    var locallyTyping = false;
    var activeFilter = 'all';
    var csrfTokenElement = document.querySelector('meta[name="_csrf"]');
    var csrfHeaderElement = document.querySelector('meta[name="_csrf_header"]');
    var currentUsername = body.dataset.currentUsername || '';

    var announce = function (message) {
        if (!liveRegion) {
            return;
        }

        liveRegion.textContent = '';
        window.setTimeout(function () {
            liveRegion.textContent = message;
        }, 20);
    };

    var hideTypingIndicator = function () {
        if (remoteTypingTimer) {
            window.clearTimeout(remoteTypingTimer);
            remoteTypingTimer = null;
        }

        if (typingState) {
            typingState.hidden = true;
        }
    };

    var showTypingIndicator = function (username) {
        if (!typingState) {
            return;
        }

        if (typingLabel) {
            typingLabel.textContent = (username || 'Someone') + ' is typing';
        }

        typingState.hidden = false;

        if (remoteTypingTimer) {
            window.clearTimeout(remoteTypingTimer);
        }

        remoteTypingTimer = window.setTimeout(
                hideTypingIndicator,
                2400
        );
    };

    var handleTypingEvent = function (event) {
        if (!event
                || !currentRoomId
                || String(event.roomId) !== String(currentRoomId)
                || event.username === currentUsername) {
            return;
        }

        if (event.typing) {
            showTypingIndicator(event.username);
        } else {
            hideTypingIndicator();
        }
    };

    var publishTypingState = function (typing) {
        if (!currentRoomId
                || !stompClient
                || !stompClient.connected) {
            return;
        }

        stompClient.publish({
            destination: '/app/chat.typing/' + currentRoomId,
            body: JSON.stringify({typing: Boolean(typing)})
        });
    };

    var startTyping = function () {
        if (!currentRoomId
                || !messageInput
                || messageInput.readOnly
                || !stompClient
                || !stompClient.connected) {
            return;
        }

        if (!locallyTyping) {
            locallyTyping = true;
            publishTypingState(true);
        }
    };

    var stopTyping = function () {
        if (!locallyTyping) {
            return;
        }

        locallyTyping = false;
        publishTypingState(false);
    };

    var apiRequest = async function (url, options) {
        var requestOptions = Object.assign(
                {credentials: 'same-origin'},
                options || {}
        );
        var headers = new Headers(requestOptions.headers || {});

        if (requestOptions.body && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }

        if (requestOptions.method && requestOptions.method !== 'GET') {
            if (csrfTokenElement && csrfHeaderElement) {
                headers.set(
                        csrfHeaderElement.content,
                        csrfTokenElement.content
                );
            }
        }

        requestOptions.headers = headers;

        var response = await fetch(url, requestOptions);
        var responseText = await response.text();
        var data = null;

        if (responseText) {
            try {
                data = JSON.parse(responseText);
            } catch (error) {
                throw new Error('Unexpected server response.');
            }
        }

        if (!response.ok) {
            throw new Error(
                    data && data.message
                            ? data.message
                            : 'Could not complete the request.'
            );
        }

        return data;
    };

    var defaultAvatarMarkup = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
            + '<circle cx="12" cy="8" r="3.1" fill="currentColor"/>'
            + '<path d="M5.8 19.2C6.45 15.9 8.55 14.2 12 14.2C15.45 14.2 17.55 15.9 18.2 19.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
            + '</svg>';

    var normalizeAvatarUrl = function (avatarUrl) {
        if (typeof avatarUrl !== 'string') {
            return '';
        }

        var normalizedUrl = avatarUrl.trim();
        return normalizedUrl === 'null' || normalizedUrl === 'undefined'
                ? ''
                : normalizedUrl;
    };

    var applyAvatarContent = function (element, avatarUrl) {
        if (!element) {
            return;
        }

        var normalizedUrl = normalizeAvatarUrl(avatarUrl);
        var hasImage = Boolean(normalizedUrl);

        element.classList.toggle('avatar--default', !hasImage);
        element.classList.toggle(
                'account-avatar--default',
                !hasImage && element.classList.contains('account-avatar')
        );
        element.innerHTML = '';

        if (!hasImage) {
            element.innerHTML = defaultAvatarMarkup;
            return;
        }

        var image = document.createElement('img');
        image.src = normalizedUrl;
        image.alt = '';
        image.loading = 'lazy';
        image.addEventListener('error', function () {
            applyAvatarContent(element, '');
        }, {once: true});
        element.appendChild(image);
    };

    var createAvatar = function (name, sizeClass, online, avatarUrl) {
        var avatar = document.createElement('span');
        avatar.className = 'avatar';

        if (sizeClass) {
            avatar.classList.add(sizeClass);
        }

        if (online) {
            avatar.classList.add('avatar--online');
        }

        applyAvatarContent(avatar, avatarUrl);
        avatar.setAttribute('aria-hidden', 'true');
        return avatar;
    };

    var updateAvatar = function (element, name, sizeClass, online, avatarUrl) {
        if (!element) {
            return;
        }

        element.className = 'avatar';

        if (sizeClass) {
            element.classList.add(sizeClass);
        }

        if (online) {
            element.classList.add('avatar--online');
        }

        applyAvatarContent(element, avatarUrl);
    };

    var initializeAccountAvatar = function () {
        if (accountAvatar) {
            applyAvatarContent(
                    accountAvatar,
                    accountAvatar.getAttribute('data-avatar-url')
            );
        }
    };

    var formatTime = function (value) {
        if (!value) {
            return '';
        }

        var date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '';
        }

        return new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: '2-digit'
        }).format(date);
    };

    var getRoomPreview = function (room) {
        if (!room.lastMessage) {
            return 'No messages yet';
        }

        return room.lastMessage.content;
    };

    var setRoomPreview = function (room) {
        var roomElement = document.querySelector(
                '[data-conversation][data-room-id="' + room.id + '"]'
        );

        if (!roomElement) {
            return;
        }

        var previewElement = roomElement.querySelector(
                '.conversation-item__bottomline > span'
        );
        var timeElement = roomElement.querySelector('time');

        if (previewElement) {
            previewElement.textContent = getRoomPreview(room);
        }

        if (timeElement) {
            timeElement.textContent = formatTime(
                    room.updatedAt || (room.lastMessage && room.lastMessage.sentAt)
            );
        }
    };

    var applyConversationFilter = function () {
        var query = searchInput
                ? searchInput.value.trim().toLowerCase()
                : '';
        var visibleCount = 0;

        document.querySelectorAll('[data-conversation]').forEach(function (item) {
            var categories = (item.getAttribute('data-category') || '').split(' ');
            var name = (item.getAttribute('data-name') || '').toLowerCase();
            var matchesFilter = activeFilter === 'all'
                    || categories.indexOf(activeFilter) !== -1;
            var matchesSearch = !query
                    || name.indexOf(query) !== -1
                    || item.textContent.toLowerCase().indexOf(query) !== -1;
            var isVisible = matchesFilter && matchesSearch;

            item.hidden = !isVisible;
            if (isVisible) {
                visibleCount += 1;
            }
        });

        if (conversationEmpty) {
            conversationEmpty.hidden = visibleCount > 0;
            conversationEmpty.textContent = rooms.length === 0
                    ? 'No conversations yet. Start one above.'
                    : 'No conversations found.';
        }
    };

    var setComposerEnabled = function (enabled) {
        if (messageInput) {
            messageInput.readOnly = !enabled;
            messageInput.setAttribute('aria-disabled', String(!enabled));
            messageInput.placeholder = enabled
                    ? 'Write a message...'
                    : 'Select a conversation first';
        }

        if (sendButton) {
            sendButton.disabled = !enabled;
        }

    };

    var updateRoomDetails = function (room) {
        var contactName = document.querySelector('[data-contact-name]');
        var contactStatus = document.querySelector('[data-contact-status]');
        var contactStatusDot = document.querySelector('[data-contact-status-dot]');
        var contactAvatar = document.querySelector('[data-contact-avatar]');
        var introAvatar = document.querySelector('[data-chat-intro-avatar]');
        var introLabel = document.querySelector('[data-chat-intro-label]');
        var introTitle = document.querySelector('[data-chat-intro-title]');
        var introDescription = document.querySelector('[data-chat-intro-description]');

        if (!room) {
            hideTypingIndicator();

            if (mainPanel) {
                mainPanel.dataset.currentRoomId = '';
            }

            if (contactName) {
                contactName.textContent = 'Select a conversation';
            }

            if (contactStatus) {
                contactStatus.textContent = 'Not connected';
            }

            if (contactStatusDot) {
                contactStatusDot.hidden = true;
            }

            updateAvatar(contactAvatar, '--', null, false, null);
            updateAvatar(introAvatar, '--', 'avatar--large', false, null);

            if (introLabel) {
                introLabel.textContent = 'Your conversations';
            }

            if (introTitle) {
                introTitle.textContent = 'Choose a conversation.';
            }

            if (introDescription) {
                introDescription.textContent =
                        'Start a new conversation or select one from your inbox.';
            }

            if (chatIntro) {
                chatIntro.hidden = false;
            }

            setComposerEnabled(false);
            return;
        }

        if (mainPanel) {
            mainPanel.dataset.currentRoomId = String(room.id);
        }

        if (contactName) {
            contactName.textContent = room.name;
        }

        if (contactStatus) {
            contactStatus.textContent = 'Ready to chat';
        }

        if (contactStatusDot) {
            contactStatusDot.hidden = false;
        }

        updateAvatar(contactAvatar, room.name, null, true, room.avatarUrl);
        updateAvatar(
                introAvatar,
                room.name,
                'avatar--large',
                true,
                room.avatarUrl
        );

        if (introLabel) {
            introLabel.textContent = 'Your conversation';
        }

        if (introTitle) {
            introTitle.textContent = 'Nice to see you again.';
        }

        if (introDescription) {
            introDescription.textContent =
                    'A private conversation with ' + room.name + '.';
        }

        if (chatIntro) {
            chatIntro.hidden = true;
        }

        setComposerEnabled(true);
    };

    var createConversationItem = function (room) {
        var item = document.createElement('button');
        var lastMessageDate = room.lastMessage
                ? room.lastMessage.sentAt
                : room.updatedAt;

        item.className = 'conversation-item';
        item.type = 'button';
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', 'false');
        item.dataset.conversation = '';
        item.dataset.roomId = String(room.id);
        item.dataset.category = 'inbox';
        item.dataset.name = room.name || '';

        item.appendChild(createAvatar(room.name, null, true, room.avatarUrl));

        var itemBody = document.createElement('span');
        itemBody.className = 'conversation-item__body';

        var topline = document.createElement('span');
        topline.className = 'conversation-item__topline';

        var name = document.createElement('strong');
        name.textContent = room.name;

        var time = document.createElement('time');
        time.textContent = formatTime(lastMessageDate);

        topline.append(name, time);

        var bottomline = document.createElement('span');
        bottomline.className = 'conversation-item__bottomline';

        var preview = document.createElement('span');
        preview.textContent = getRoomPreview(room);

        bottomline.appendChild(preview);
        itemBody.append(topline, bottomline);
        item.appendChild(itemBody);

        item.addEventListener('click', function () {
            selectRoom(room);
        });

        return item;
    };

    var renderRooms = function () {
        if (!conversationList) {
            return;
        }

        conversationList.innerHTML = '';

        rooms.forEach(function (room) {
            conversationList.appendChild(createConversationItem(room));
        });

        applyConversationFilter();
    };

    var createMessageElement = function (message) {
        var isMine = message.senderUsername === currentUsername;
        var row = document.createElement('li');
        row.className = 'message-row ' + (
                isMine
                        ? 'message-row--outgoing'
                        : 'message-row--incoming'
        );

        if (!isMine) {
            row.appendChild(createAvatar(
                    message.senderUsername,
                    'avatar--small',
                    false,
                    message.senderAvatarUrl
            ));
        }

        var stack = document.createElement('div');
        stack.className = 'message-stack';

        if (!isMine) {
            var authorLine = document.createElement('div');
            authorLine.className = 'message-author-line';

            var author = document.createElement('strong');
            author.textContent = message.senderUsername;

            var incomingTime = document.createElement('time');
            incomingTime.textContent = formatTime(message.sentAt);

            authorLine.append(author, incomingTime);
            stack.appendChild(authorLine);
        }

        var bubble = document.createElement('div');
        bubble.className = 'message-bubble ' + (
                isMine
                        ? 'message-bubble--outgoing'
                        : 'message-bubble--incoming'
        );
        bubble.textContent = message.content;
        stack.appendChild(bubble);

        var metaLine = document.createElement('div');
        metaLine.className = 'message-author-line' + (
                isMine ? ' message-author-line--outgoing' : ''
        );

        var metaTime = document.createElement('time');
        metaTime.textContent = isMine
                ? formatTime(message.sentAt) + ' · Sent'
                : formatTime(message.sentAt);

        metaLine.appendChild(metaTime);
        stack.appendChild(metaLine);
        row.appendChild(stack);

        if (message.id !== null && message.id !== undefined) {
            row.dataset.messageId = String(message.id);
        }

        return row;
    };

    var scrollToBottom = function () {
        if (!chatScroll) {
            return;
        }

        chatScroll.scrollTo({
            top: chatScroll.scrollHeight,
            behavior: 'smooth'
        });
    };

    var renderMessages = function (messages) {
        if (!messageThread) {
            return;
        }

        messageThread.innerHTML = '';

        (messages || []).forEach(function (message) {
            messageThread.appendChild(createMessageElement(message));
        });

        window.setTimeout(scrollToBottom, 0);
    };

    var appendMessageToUI = function (message) {
        if (!messageThread
                || String(message.roomId) !== String(currentRoomId)) {
            return;
        }

        var messageId = message.id === null || message.id === undefined
                ? null
                : String(message.id);
        var alreadyRendered = messageId && Array.prototype.some.call(
                messageThread.querySelectorAll('[data-message-id]'),
                function (element) {
                    return element.dataset.messageId === messageId;
                }
        );

        if (alreadyRendered) {
            return;
        }

        messageThread.appendChild(createMessageElement(message));
        scrollToBottom();

        var room = rooms.find(function (item) {
            return String(item.id) === String(message.roomId);
        });

        if (room) {
            room.lastMessage = message;
            room.updatedAt = message.sentAt;
            setRoomPreview(room);
        }
    };

    var loadMessages = async function (roomId) {
        try {
            var messages = await apiRequest(
                    '/api/chat/rooms/' + roomId + '/messages'
            );

            if (String(roomId) === String(currentRoomId)) {
                renderMessages(messages);
            }
        } catch (error) {
            renderMessages([]);
            announce(error.message);
        }
    };

    var subscribeToRoom = function (roomId) {
        if (!stompClient || !stompClient.connected) {
            return;
        }

        if (roomSubscription) {
            roomSubscription.unsubscribe();
        }

        if (typingSubscription) {
            typingSubscription.unsubscribe();
        }

        roomSubscription = stompClient.subscribe(
                '/topic/chat/rooms/' + roomId,
                function (frame) {
                    appendMessageToUI(JSON.parse(frame.body));
                }
        );

        typingSubscription = stompClient.subscribe(
                '/topic/chat/rooms/' + roomId + '/typing',
                function (frame) {
                    handleTypingEvent(JSON.parse(frame.body));
                }
        );
    };

    var selectRoom = function (room) {
        stopTyping();
        hideTypingIndicator();

        currentRoom = room;
        currentRoomId = room ? String(room.id) : null;

        document.querySelectorAll('[data-conversation]').forEach(function (item) {
            var isActive = room
                    && String(item.dataset.roomId) === String(room.id);
            item.classList.toggle('is-active', Boolean(isActive));
            item.setAttribute('aria-selected', String(Boolean(isActive)));
        });

        updateRoomDetails(room);

        if (!room) {
            renderMessages([]);
            return;
        }

        loadMessages(room.id);
        subscribeToRoom(room.id);
        closeSidebar();
    };

    var loadRooms = async function (preferredRoomId) {
        try {
            rooms = await apiRequest('/api/chat/rooms') || [];
            renderRooms();

            if (rooms.length === 0) {
                currentRoom = null;
                currentRoomId = null;
                updateRoomDetails(null);
                renderMessages([]);
                return;
            }

            var nextRoom = rooms.find(function (room) {
                return preferredRoomId
                        && String(room.id) === String(preferredRoomId);
            }) || rooms[0];

            selectRoom(nextRoom);
        } catch (error) {
            rooms = [];
            renderRooms();
            updateRoomDetails(null);
            renderMessages([]);
            announce(error.message);
        }
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

    var openModal = function () {
        if (!modal) {
            return;
        }

        modal.hidden = false;
        body.classList.add('modal-open');

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
        body.classList.remove('modal-open');
    };

    var startNewChat = async function () {
        var targetUsername = modalInput
                ? modalInput.value.trim()
                : '';

        if (!targetUsername) {
            if (modalInput) {
                modalInput.focus();
            }
            announce('Enter a username to continue.');
            return;
        }

        try {
            var room = await apiRequest('/api/chat/rooms/direct', {
                method: 'POST',
                body: JSON.stringify({username: targetUsername})
            });

            closeModal();
            await loadRooms(room.id);
            announce('Conversation with ' + room.name + ' is ready.');
        } catch (error) {
            announce(error.message);
        }
    };

    var sendMessageWithRest = async function (message) {
        var response = await apiRequest(
                '/api/chat/rooms/' + currentRoomId + '/messages',
                {
                    method: 'POST',
                    body: JSON.stringify({content: message})
                }
        );

        appendMessageToUI(response);
    };

    if (searchInput) {
        searchInput.addEventListener('input', applyConversationFilter);
    }

    document.querySelectorAll('[data-action]').forEach(function (control) {
        control.addEventListener('click', function () {
            var action = control.getAttribute('data-action');

            if (action === 'toggle-sidebar') {
                toggleSidebar();
            } else if (action === 'close-sidebar') {
                closeSidebar();
            } else if (action === 'new-chat') {
                openModal();
            } else if (action === 'close-new-chat') {
                closeModal();
            } else if (action === 'start-new-chat') {
                startNewChat();
            }
        });
    });

    if (modalInput) {
        modalInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                startNewChat();
            }
        });
    }

    var resizeMessageInput = function () {
        if (!messageInput) {
            return;
        }

        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(
                messageInput.scrollHeight,
                110
        ) + 'px';
    };

    if (messageInput) {
        messageInput.addEventListener('focus', startTyping);
        messageInput.addEventListener('input', function () {
            resizeMessageInput();
            startTyping();
        });
        messageInput.addEventListener('blur', stopTyping);
        messageInput.addEventListener('click', function () {
            if (!currentRoomId) {
                messageInput.blur();
                openModal();
            }
        });
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
        composer.addEventListener('submit', async function (event) {
            event.preventDefault();

            var message = messageInput
                    ? messageInput.value.trim()
                    : '';

            if (!message || !currentRoomId) {
                return;
            }

            stopTyping();

            try {
                if (stompClient && stompClient.connected) {
                    stompClient.publish({
                        destination: '/app/chat.send/' + currentRoomId,
                        body: JSON.stringify({content: message})
                    });
                } else {
                    await sendMessageWithRest(message);
                }

                messageInput.value = '';
                resizeMessageInput();
            } catch (error) {
                announce(error.message);
            } finally {
                if (document.activeElement === messageInput) {
                    startTyping();
                }
            }
        });
    }

    if (window.StompJs && window.StompJs.Client) {
        stompClient = new window.StompJs.Client({
            brokerURL: (
                    window.location.protocol === 'https:'
                            ? 'wss://'
                            : 'ws://'
            ) + window.location.host + '/ws',
            reconnectDelay: 5000,
            debug: function () {
                // Keep the chat UI quiet in normal use.
            }
        });

        stompClient.onConnect = function () {
            if (currentRoomId) {
                subscribeToRoom(currentRoomId);
            }

            if (document.activeElement === messageInput) {
                startTyping();
            }
        };

        stompClient.onWebSocketClose = function () {
            stopTyping();
            hideTypingIndicator();

            if (currentRoomId) {
                var status = document.querySelector('[data-contact-status]');

                if (status) {
                    status.textContent = 'Reconnecting...';
                }
            }
        };

        stompClient.onStompError = function () {
            announce('Realtime connection error.');
        };

        stompClient.activate();
    }

    document.addEventListener('keydown', function (event) {
        if ((event.metaKey || event.ctrlKey)
                && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            openModal();
        }

        if (event.key === '/'
                && document.activeElement !== searchInput
                && document.activeElement !== messageInput) {
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

    initializeAccountAvatar();
    setComposerEnabled(false);
    updateRoomDetails(null);
    loadRooms();
}());
