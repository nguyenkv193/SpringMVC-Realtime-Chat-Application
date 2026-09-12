package com.realtimechat.chat.repository;

import com.realtimechat.chat.entity.ChatRoomMember;
import com.realtimechat.chat.entity.ChatRoomMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatRoomMemberRepository
        extends JpaRepository<ChatRoomMember, ChatRoomMemberId> {

    Optional<ChatRoomMember> findById_RoomIdAndId_UserId(
            Long roomId,
            Long userId
    );
}
