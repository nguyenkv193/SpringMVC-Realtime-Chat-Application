package com.realtimechat.chat.repository;

import com.realtimechat.chat.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    List<Message> findByRoom_IdAndDeletedAtIsNullOrderBySentAtAsc(
            Long roomId
    );

    Optional<Message> findFirstByRoom_IdAndDeletedAtIsNullOrderBySentAtDesc(
            Long roomId
    );
}
