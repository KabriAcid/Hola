import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Message, Conversation } from "../../types";
import ConversationHeader from "./ConversationHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import TypingIndicator from "./TypingIndicator";
import { useAuth } from "../../hooks/useAuth";

interface ChatScreenProps {
  conversation: Conversation;
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
  onCall?: () => void;
  onVideoCall?: () => void;
  onTyping?: (isTyping: boolean) => void;
  onMarkAsRead?: (messageId: number) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when they come into view
  useEffect(() => {
    if (onMarkAsRead && messages.length > 0) {
      const unreadMessages = messages.filter(
        (msg) =>
          !msg.is_own && msg.status?.every((status) => status.status !== "read")
      );

      unreadMessages.forEach((message) => {
        onMarkAsRead(message.id);
      });
    }
  }, [messages, onMarkAsRead]);

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

  const shouldShowAvatar = (message: Message, index: number) => {
    if (message.is_own) return false;
    if (conversation.type === "direct") return false;

    // Show avatar if it's the last message from this sender in a group
    const nextMessage = messages[index + 1];
    return (
      !nextMessage ||
      nextMessage.sender_id !== message.sender_id ||
      nextMessage.is_own
    );
  };

  const shouldShowTimestamp = (message: Message, index: number) => {
    if (index === 0) return true;

    const prevMessage = messages[index - 1];
    const currentTime = new Date(message.created_at);
    const prevTime = new Date(prevMessage.created_at);

    // Show timestamp if more than 10 minutes apart
    return currentTime.getTime() - prevTime.getTime() > 10 * 60 * 1000;
  };

  const isMessageGrouped = (message: Message, index: number) => {
    const prevMessage = messages[index - 1];
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Conversation Header */}
      <ConversationHeader
        conversation={conversation}
        onBack={onBack}
        onCall={onCall}
        onVideoCall={onVideoCall}
      />

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto bg-gray-50"
      >
        <div className="px-4 py-2">
          {messages.map((message, index) => (
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
