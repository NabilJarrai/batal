package com.batal.entity;

import com.batal.entity.enums.CommunicationStatus;
import com.batal.entity.enums.CommunicationType;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "communications",
       indexes = {
           @Index(name = "idx_communication_sender", columnList = "sender_id"),
           @Index(name = "idx_communication_receiver", columnList = "receiver_id"),
           @Index(name = "idx_communication_type", columnList = "type"),
           @Index(name = "idx_communication_status", columnList = "status"),
           @Index(name = "idx_communication_created", columnList = "created_at")
       })
public class Communication {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id")
    private User receiver;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CommunicationType type;
    
    @NotBlank
    @Size(max = 255)
    @Column(nullable = false, length = 255)
    private String subject;
    
    @NotBlank
    @Size(max = 5000)
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;
    
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CommunicationStatus status = CommunicationStatus.OPEN;
    
    @Size(max = 20)
    @Column(length = 20)
    private String priority;
    
    @OneToMany(mappedBy = "communication", fetch = FetchType.LAZY, 
               cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<CommunicationReply> replies = new HashSet<>();
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
    
    public Communication() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public Communication(User sender, CommunicationType type, String subject, String message) {
        this();
        this.sender = sender;
        this.type = type;
        this.subject = subject;
        this.message = message;
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (status == CommunicationStatus.RESOLVED && resolvedAt == null) {
            this.resolvedAt = LocalDateTime.now();
        }
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getSender() {
        return sender;
    }
    
    public void setSender(User sender) {
        this.sender = sender;
    }
    
    public User getReceiver() {
        return receiver;
    }
    
    public void setReceiver(User receiver) {
        this.receiver = receiver;
    }
    
    public CommunicationType getType() {
        return type;
    }
    
    public void setType(CommunicationType type) {
        this.type = type;
    }
    
    public String getSubject() {
        return subject;
    }
    
    public void setSubject(String subject) {
        this.subject = subject;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public CommunicationStatus getStatus() {
        return status;
    }
    
    public void setStatus(CommunicationStatus status) {
        this.status = status;
    }
    
    public String getPriority() {
        return priority;
    }
    
    public void setPriority(String priority) {
        this.priority = priority;
    }
    
    public Set<CommunicationReply> getReplies() {
        return replies;
    }
    
    public void setReplies(Set<CommunicationReply> replies) {
        this.replies = replies;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public LocalDateTime getResolvedAt() {
        return resolvedAt;
    }
    
    public void setResolvedAt(LocalDateTime resolvedAt) {
        this.resolvedAt = resolvedAt;
    }
    
    // Utility methods
    public void addReply(CommunicationReply reply) {
        replies.add(reply);
        reply.setCommunication(this);
        this.status = CommunicationStatus.IN_PROGRESS;
    }
    
    public void removeReply(CommunicationReply reply) {
        replies.remove(reply);
        reply.setCommunication(null);
    }
    
    public boolean isOpen() {
        return status == CommunicationStatus.OPEN;
    }
    
    public boolean isInProgress() {
        return status == CommunicationStatus.IN_PROGRESS;
    }
    
    public boolean isResolved() {
        return status == CommunicationStatus.RESOLVED;
    }
    
    public boolean isClosed() {
        return status == CommunicationStatus.CLOSED;
    }
    
    public void markAsResolved(User resolvedBy) {
        this.status = CommunicationStatus.RESOLVED;
        this.resolvedAt = LocalDateTime.now();
        
        // Add a system reply indicating resolution
        CommunicationReply resolvedReply = new CommunicationReply(
                this, 
                resolvedBy, 
                "Issue has been marked as resolved."
        );
        addReply(resolvedReply);
    }
    
    public long getResponseTimeHours() {
        if (replies.isEmpty()) return 0;
        CommunicationReply firstReply = replies.stream()
                .min((r1, r2) -> r1.getCreatedAt().compareTo(r2.getCreatedAt()))
                .orElse(null);
        if (firstReply == null) return 0;
        
        return java.time.temporal.ChronoUnit.HOURS.between(createdAt, firstReply.getCreatedAt());
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Communication)) return false;
        Communication that = (Communication) o;
        return id != null && id.equals(that.id);
    }
    
    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }
    
    @Override
    public String toString() {
        return "Communication{" +
                "id=" + id +
                ", sender=" + (sender != null ? sender.getFullName() : null) +
                ", type=" + type +
                ", subject='" + subject + '\'' +
                ", status=" + status +
                ", createdAt=" + createdAt +
                '}';
    }
}
