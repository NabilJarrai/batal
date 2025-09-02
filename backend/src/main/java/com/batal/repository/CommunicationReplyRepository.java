package com.batal.repository;

import com.batal.entity.CommunicationReply;
import com.batal.entity.Communication;
import com.batal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CommunicationReplyRepository extends JpaRepository<CommunicationReply, Long> {
    
    List<CommunicationReply> findByCommunication(Communication communication);
    
    List<CommunicationReply> findByCommunicationId(Long communicationId);
    
    List<CommunicationReply> findByAuthor(User author);
    
    List<CommunicationReply> findByAuthorId(Long authorId);
    
    List<CommunicationReply> findByIsInternalTrue();
    
    List<CommunicationReply> findByIsInternalFalse();
    
    List<CommunicationReply> findByCommunicationAndIsInternal(Communication communication, Boolean isInternal);
    
    List<CommunicationReply> findByCommunicationIdAndIsInternal(Long communicationId, Boolean isInternal);
    
    List<CommunicationReply> findByMessageContainingIgnoreCase(String message);
    
    List<CommunicationReply> findByCreatedAtBetween(LocalDateTime startTime, LocalDateTime endTime);
    
    List<CommunicationReply> findByCommunicationAndCreatedAtBetween(Communication communication, 
                                                                  LocalDateTime startTime, 
                                                                  LocalDateTime endTime);
    
    List<CommunicationReply> findByAuthorAndCreatedAtBetween(User author, 
                                                           LocalDateTime startTime, 
                                                           LocalDateTime endTime);
    
    @Query("SELECT cr FROM CommunicationReply cr WHERE cr.communication = :communication ORDER BY cr.createdAt ASC")
    List<CommunicationReply> findByCommunicationOrderByCreatedAtAsc(@Param("communication") Communication communication);
    
    @Query("SELECT cr FROM CommunicationReply cr WHERE cr.communication.id = :communicationId ORDER BY cr.createdAt ASC")
    List<CommunicationReply> findByCommunicationIdOrderByCreatedAtAsc(@Param("communicationId") Long communicationId);
    
    @Query("SELECT cr FROM CommunicationReply cr WHERE cr.author = :author ORDER BY cr.createdAt DESC")
    List<CommunicationReply> findByAuthorOrderByCreatedAtDesc(@Param("author") User author);
    
    @Query("SELECT cr FROM CommunicationReply cr WHERE cr.author.id = :authorId ORDER BY cr.createdAt DESC")
    List<CommunicationReply> findByAuthorIdOrderByCreatedAtDesc(@Param("authorId") Long authorId);
    
    @Query("SELECT cr FROM CommunicationReply cr WHERE cr.communication = :communication AND cr.isInternal = false ORDER BY cr.createdAt ASC")
    List<CommunicationReply> findPublicRepliesByCommunication(@Param("communication") Communication communication);
    
    @Query("SELECT cr FROM CommunicationReply cr WHERE cr.communication.id = :communicationId AND cr.isInternal = false ORDER BY cr.createdAt ASC")
    List<CommunicationReply> findPublicRepliesByCommunicationId(@Param("communicationId") Long communicationId);
    
    @Query("SELECT cr FROM CommunicationReply cr WHERE cr.communication = :communication AND cr.isInternal = true ORDER BY cr.createdAt ASC")
    List<CommunicationReply> findInternalRepliesByCommunication(@Param("communication") Communication communication);
    
    @Query("SELECT cr FROM CommunicationReply cr WHERE cr.communication.id = :communicationId AND cr.isInternal = true ORDER BY cr.createdAt ASC")
    List<CommunicationReply> findInternalRepliesByCommunicationId(@Param("communicationId") Long communicationId);
    
    @Query("SELECT COUNT(cr) FROM CommunicationReply cr WHERE cr.communication = :communication")
    long countByCommunication(@Param("communication") Communication communication);
    
    @Query("SELECT COUNT(cr) FROM CommunicationReply cr WHERE cr.communication.id = :communicationId")
    long countByCommunicationId(@Param("communicationId") Long communicationId);
    
    @Query("SELECT COUNT(cr) FROM CommunicationReply cr WHERE cr.communication = :communication AND cr.isInternal = :isInternal")
    long countByCommunicationAndIsInternal(@Param("communication") Communication communication, 
                                         @Param("isInternal") Boolean isInternal);
    
    @Query("SELECT COUNT(cr) FROM CommunicationReply cr WHERE cr.author = :author")
    long countByAuthor(@Param("author") User author);
    
    @Query("SELECT cr FROM CommunicationReply cr WHERE cr.author.userType = 'ADMIN' OR cr.author.userType = 'MANAGER' ORDER BY cr.createdAt DESC")
    List<CommunicationReply> findRepliesByStaff();
}
