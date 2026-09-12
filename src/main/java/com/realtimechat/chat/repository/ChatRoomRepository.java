package com.realtimechat.chat.repository;

import com.realtimechat.chat.entity.ChatRoom;
import com.realtimechat.chat.entity.RoomType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    @Query("""
            select distinct room
            from ChatRoom room
            join room.members member
            where member.user.username = :username
            order by room.updatedAt desc
            """)
    List<ChatRoom> findAllForUser(
            @Param("username") String username
    );

    @Query("""
            select distinct room
            from ChatRoom room
            join room.members firstMember
            join room.members secondMember
            where room.roomType = :roomType
              and firstMember.user.id = :firstUserId
              and secondMember.user.id = :secondUserId
            """)
    List<ChatRoom> findRoomsBetweenUsers(
            @Param("roomType") RoomType roomType,
            @Param("firstUserId") Long firstUserId,
            @Param("secondUserId") Long secondUserId
    );
}
