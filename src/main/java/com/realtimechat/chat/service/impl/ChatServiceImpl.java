package com.realtimechat.chat.service.impl;

import com.realtimechat.chat.dto.request.CreateDirectRoomRequest;
import com.realtimechat.chat.dto.request.SendMessageRequest;
import com.realtimechat.chat.dto.response.ChatRoomResponse;
import com.realtimechat.chat.dto.response.MessageResponse;
import com.realtimechat.chat.entity.ChatRoom;
import com.realtimechat.chat.entity.ChatRoomMember;
import com.realtimechat.chat.entity.ChatRoomMemberId;
import com.realtimechat.chat.entity.Message;
import com.realtimechat.chat.entity.MessageType;
import com.realtimechat.chat.entity.RoomType;
import com.realtimechat.chat.repository.ChatRoomMemberRepository;
import com.realtimechat.chat.repository.ChatRoomRepository;
import com.realtimechat.chat.repository.MessageRepository;
import com.realtimechat.chat.service.ChatService;
import com.realtimechat.common.exception.ResourceNotFoundException;
import com.realtimechat.user.entity.User;
import com.realtimechat.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatServiceImpl implements ChatService {

    private final UserRepository userRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository memberRepository;
    private final MessageRepository messageRepository;

    @Override
    public List<ChatRoomResponse> getMyRooms(String username) {
        User currentUser = findUser(username);

        return chatRoomRepository.findAllForUser(username)
                .stream()
                .map(room -> toRoomResponse(room, currentUser.getId()))
                .toList();
    }

    @Override
    public List<MessageResponse> getMessages(
            String username,
            Long roomId
    ) {
        User currentUser = findUser(username);
        findRoomForMember(currentUser, roomId);

        return messageRepository
                .findByRoom_IdAndDeletedAtIsNullOrderBySentAtAsc(roomId)
                .stream()
                .map(this::toMessageResponse)
                .toList();
    }

    @Override
    public void assertRoomMember(
            String username,
            Long roomId
    ) {
        findRoomForMember(findUser(username), roomId);
    }

    @Override
    @Transactional
    public ChatRoomResponse createDirectRoom(
            String username,
            CreateDirectRoomRequest request
    ) {
        User currentUser = findUser(username);
        String targetUsername = request.username().trim();

        User targetUser = userRepository.findByUsername(targetUsername)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "error.user.not-found"
                        ));

        if (currentUser.getId().equals(targetUser.getId())) {
            throw new IllegalArgumentException("error.chat.self-room");
        }

        List<ChatRoom> existingRooms =
                chatRoomRepository.findRoomsBetweenUsers(
                        RoomType.DIRECT,
                        currentUser.getId(),
                        targetUser.getId()
                );

        if (!existingRooms.isEmpty()) {
            return toRoomResponse(
                    existingRooms.get(0),
                    currentUser.getId()
            );
        }

        Instant now = Instant.now();

        ChatRoom room = ChatRoom.builder()
                .roomType(RoomType.DIRECT)
                .createdBy(currentUser)
                .createdAt(now)
                .updatedAt(now)
                .build();

        chatRoomRepository.save(room);

        ChatRoomMember currentMember = createMember(
                room,
                currentUser,
                now
        );

        ChatRoomMember targetMember = createMember(
                room,
                targetUser,
                now
        );

        room.getMembers().add(currentMember);
        room.getMembers().add(targetMember);

        memberRepository.saveAll(
                List.of(currentMember, targetMember)
        );

        return toRoomResponse(room, currentUser.getId());
    }

    @Override
    @Transactional
    public MessageResponse sendMessage(
            String username,
            Long roomId,
            SendMessageRequest request
    ) {
        User currentUser = findUser(username);
        ChatRoom room = findRoomForMember(currentUser, roomId);

        if (request == null
                || request.content() == null
                || request.content().isBlank()) {
            throw new IllegalArgumentException(
                    "validation.chat.content.required"
            );
        }

        String content = request.content().trim();

        if (content.length() > 5000) {
            throw new IllegalArgumentException(
                    "validation.chat.content.size"
            );
        }

        Instant now = Instant.now();

        Message message = Message.builder()
                .room(room)
                .sender(currentUser)
                .content(content)
                .messageType(MessageType.TEXT)
                .sentAt(now)
                .build();

        room.setUpdatedAt(now);

        Message savedMessage = messageRepository.save(message);

        return toMessageResponse(savedMessage);
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "error.user.not-found"
                        ));
    }

    private ChatRoom findRoomForMember(
            User user,
            Long roomId
    ) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "error.chat.room-not-found"
                        ));

        memberRepository
                .findById_RoomIdAndId_UserId(roomId, user.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "error.chat.room-not-found"
                        ));

        return room;
    }

    private ChatRoomMember createMember(
            ChatRoom room,
            User user,
            Instant joinedAt
    ) {
        return ChatRoomMember.builder()
                .id(new ChatRoomMemberId(
                        room.getId(),
                        user.getId()
                ))
                .room(room)
                .user(user)
                .joinedAt(joinedAt)
                .build();
    }

    private ChatRoomResponse toRoomResponse(
            ChatRoom room,
            Long currentUserId
    ) {
        String name;
        String avatarUrl;

        if (room.getRoomType() == RoomType.GROUP) {
            name = room.getName() != null
                    ? room.getName()
                    : "Unnamed group";
            avatarUrl = null;
        } else {
            ChatRoomMember otherMember = room.getMembers()
                    .stream()
                    .filter(member ->
                            !member.getUser()
                                    .getId()
                                    .equals(currentUserId))
                    .findFirst()
                    .orElse(null);

            name = otherMember != null
                    ? otherMember.getUser().getUsername()
                    : "Direct conversation";

            avatarUrl = otherMember != null
                    ? otherMember.getUser().getAvatarUrl()
                    : null;
        }

        Message lastMessage = messageRepository
                .findFirstByRoom_IdAndDeletedAtIsNullOrderBySentAtDesc(
                        room.getId()
                )
                .orElse(null);

        return new ChatRoomResponse(
                room.getId(),
                name,
                room.getRoomType(),
                avatarUrl,
                room.getUpdatedAt(),
                lastMessage == null
                        ? null
                        : toMessageResponse(lastMessage)
        );
    }

    private MessageResponse toMessageResponse(Message message) {
        User sender = message.getSender();

        return new MessageResponse(
                message.getId(),
                message.getRoom().getId(),
                sender.getId(),
                sender.getUsername(),
                sender.getAvatarUrl(),
                message.getContent(),
                message.getMessageType(),
                message.getSentAt()
        );
    }
}
