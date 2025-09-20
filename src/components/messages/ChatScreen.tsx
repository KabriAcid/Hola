import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Message, Conversation, Contact } from "../../types";
import ConversationHeader from "./ConversationHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import { useAuth } from "../../hooks/useAuth";

interface ChatScreenProps {
  // Support both old contact-based and new conversation-based chat
  contact?: Contact;
  conversation?: Conversation;
  messages: Message[];
  typingUsers?: Array<{
    id: number;
    full_name: string;
    avatar?: string;
  }>;
  onSendMessage: (
    content: string,
    messageType?: "text" | "image" | "audio" | "file"
  ) => Promise<void>;
  onBack: () => void;
  onCall?: (contact: Contact) => void;
  onVideoCall?: () => void;
  onTyping?: (isTyping: boolean) => void;
  onMarkAsRead?: (messageId: number) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  contact,
  conversation,
  messages,
  typingUsers = [],
  onSendMessage,
  onBack,
  onCall,
  onVideoCall,
  onTyping,
  onMarkAsRead,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Create a normalized conversation object from either contact or conversation
  const normalizedConversation = React.useMemo(() => {
    if (conversation) {
      return {
        id: conversation.id,
        type: conversation.type,
        name: conversation.name,
        avatar: conversation.avatar,
        participants:
          conversation.participants?.map((p) => ({
            id: p.user_id,
            full_name: p.user?.full_name || "Unknown",
            avatar: p.user?.avatar,
            status: p.user?.status,
            last_seen: p.user?.last_seen,
          })) || [],
      };
    }

    if (contact) {
      return {
        id: 0, // Temporary ID for contact-based chat
        type: "direct" as const,
        name: contact.name,
        avatar: contact.avatar,
        participants: [
          {
            id: Number(contact.id),
            full_name: contact.name,
            avatar: contact.avatar,
            status: contact.isOnline
              ? ("online" as const)
              : ("offline" as const),
            last_seen: undefined,
          },
        ],
      };
    }

    return null;
  }, [contact, conversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (
    content: string,
    messageType: "text" | "image" | "audio" | "file" = "text"
  ) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);

    try {
      await onSendMessage(content, messageType);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Process messages to work with both old and new message formats
  const processedMessages = React.useMemo(() => {
    return messages.map((msg: any) => {
      // Handle both old and new message formats
      if (msg.created_at) {
        // New format
        return {
          ...msg,
          is_own: msg.sender_id === Number(user?.id) || msg.is_own || false,
        };
      } else {
        // Old format - convert to new format
        return {
          id:
            typeof msg.id === "string"
              ? parseInt(msg.id.replace("msg_", "")) || Date.now()
              : msg.id || Date.now(),
          conversation_id: 0,
          sender_id: msg.isOutgoing
            ? Number(user?.id) || 0
            : Number(contact?.id) || 0,
          content: msg.content || "",
          message_type: "text" as const,
          created_at: msg.timestamp
            ? msg.timestamp.toISOString()
            : new Date().toISOString(),
          is_own: msg.isOutgoing || false,
        };
      }
    });
  }, [messages, user?.id, contact?.id]);

  // Mark messages as read when they come into view
  useEffect(() => {
    if (onMarkAsRead && processedMessages.length > 0) {
      const unreadMessages = processedMessages.filter(
        (msg: any) =>
          !msg.is_own &&
          (!msg.status ||
            msg.status.every((status: any) => status.status !== "read"))
      );

      unreadMessages.forEach((message: any) => {
        onMarkAsRead(message.id);
      });
    }
  }, [processedMessages, onMarkAsRead]);

  const shouldShowAvatar = (message: any, index: number) => {
    if (message.is_own) return false;
    if (normalizedConversation?.type === "direct") return false;

    // Show avatar if it's the last message from this sender in a group
    const nextMessage = processedMessages[index + 1];
    return (
      !nextMessage ||
      nextMessage.sender_id !== message.sender_id ||
      nextMessage.is_own
    );
  };

  const shouldShowTimestamp = (message: any, index: number) => {
    if (index === 0) return true;

    const prevMessage = processedMessages[index - 1];
    const currentTime = new Date(message.created_at);
    const prevTime = new Date(prevMessage.created_at);

    // Show timestamp if more than 10 minutes apart
    return currentTime.getTime() - prevTime.getTime() > 10 * 60 * 1000;
  };

  const isMessageGrouped = (message: any, index: number) => {
    const prevMessage = processedMessages[index - 1];
    if (!prevMessage) return false;

    const currentTime = new Date(message.created_at);
    const prevTime = new Date(prevMessage.created_at);
    const timeDiff = currentTime.getTime() - prevTime.getTime();

    // Group if same sender and within 5 minutes
    return (
      prevMessage.sender_id === message.sender_id &&
      timeDiff < 5 * 60 * 1000 &&
      prevMessage.is_own === message.is_own
    );
  };

  // Handle call button click
  const handleCallClick = () => {
    if (contact && onCall) {
      onCall(contact);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Conversation Header */}
      {normalizedConversation && (
        <ConversationHeader
          conversation={normalizedConversation}
          onBack={onBack}
          onCall={handleCallClick}
          onVideoCall={onVideoCall}
        />
      )}

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-white scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="px-4 py-2">
          {processedMessages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.02, 0.3) }}
            >
              <MessageBubble
                message={message}
                isOwn={message.is_own || false}
                showAvatar={shouldShowAvatar(message, index)}
                showTimestamp={shouldShowTimestamp(message, index)}
                isGrouped={isMessageGrouped(message, index)}
              />
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <TypingIndicator users={typingUsers} />
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={onTyping}
        disabled={isLoading}
        placeholder="Type a message..."
      />
    </div>
  );
};
