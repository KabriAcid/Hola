import React from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Conversation } from "../../types";
import { Avatar } from "../ui/Avatar";

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (contactId: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelectConversation,
}) => {
  const formatTime = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) {
      return `${minutes}m`;
    } else if (hours < 24) {
      return `${hours}h`;
    } else if (days === 1) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    return message.length > maxLength
      ? `${message.substring(0, maxLength)}...`
      : message;
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No messages yet
            </h3>
            <p className="text-gray-600">
              Start a conversation with your contacts
            </p>
          </div>
        </div>
      ) : (
        conversations.map((conversation, index) => (
          <motion.div
            key={conversation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => onSelectConversation(conversation.contactId)}
          >
            <div className="relative">
              <Avatar
                src={conversation.contactAvatar}
                alt={conversation.contactName}
                size="md"
              />
              {conversation.unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {conversation.unreadCount > 9
                    ? "9+"
                    : conversation.unreadCount}
                </div>
              )}
            </div>

            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3
                  className={`font-medium truncate ${
                    conversation.unreadCount > 0
                      ? "text-black"
                      : "text-gray-900"
                  }`}
                >
                  {conversation.contactName}
                </h3>
                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                  {formatTime(conversation.lastMessage.timestamp)}
                </span>
              </div>

              <div className="flex items-center">
                <p
                  className={`text-sm truncate ${
                    conversation.unreadCount > 0
                      ? "text-gray-900 font-medium"
                      : "text-gray-600"
                  }`}
                >
                  {conversation.lastMessage.isOutgoing && "You: "}
                  {truncateMessage(conversation.lastMessage.content)}
                </p>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
};
