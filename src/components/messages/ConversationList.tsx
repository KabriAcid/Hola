import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Search } from "lucide-react";
import { Contact, Conversation } from "../../types";
import { apiService } from "../../services/api";

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversationId: number) => void;
  onStartNewConversation?: (contactId: number) => void;
  loading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations = [],
  onSelectConversation,
  onStartNewConversation,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Load contacts for new chat
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const allContacts = await apiService.getContacts();
        setContacts(allContacts);
      } catch (error) {
        console.error("Error loading contacts:", error);
        setContacts([]);
      }
    };

    loadContacts();
  }, []);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation: Conversation) => {
    onSelectConversation(conversation.id);
  };

  // Format time for conversation preview
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else if (diffDays <= 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // Get conversation display info
  const getConversationInfo = (conversation: Conversation) => {
    if (!conversation) {
      return null; // Return null for invalid conversations
    }

    if (conversation.type === "group") {
      return {
        name: conversation.name || "Group Chat",
        avatar: conversation.avatar,
        status: `${conversation.participants?.length || 0} participants`,
      };
    }

    // For direct chats, get the other participant
    const otherParticipant = conversation.participants?.[0];
    if (!otherParticipant?.user?.full_name) {
      return null; // Skip conversations without valid participant data
    }

    return {
      name: otherParticipant.user.full_name,
      avatar: otherParticipant.user.avatar,
      status: otherParticipant.user.status === "online" ? "Online" : "Offline",
    };
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Sort contacts alphabetically
  const sortedContacts = [...contacts].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Filter contacts based on search query
  const filteredContacts = searchQuery
    ? sortedContacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phone.includes(searchQuery)
      )
    : sortedContacts;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Single Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-black mb-3">Messages</h1>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search contacts..."
            className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black text-sm"
          />
        </div>
      </div>

      {/* Horizontal Contacts List */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-none">
          {filteredContacts.map((contact) => (
            <motion.button
              key={contact.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onStartNewConversation?.(Number(contact.id))}
              className="flex-shrink-0 flex flex-col items-center space-y-1 p-2 hover:bg-gray-100 rounded-lg transition-colors min-w-16"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                {contact.avatar ? (
                  <img
                    src={`/assets/avatars/${contact.avatar}`}
                    alt={contact.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black text-white font-medium text-sm">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-xs text-black font-medium truncate max-w-16 text-center">
                {contact.name.split(" ")[0]}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Conversations List - iMessage Style */}
      <div className="flex-1 overflow-y-auto bg-white">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500 text-sm">Loading...</div>
          </div>
        ) : conversations && conversations.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {conversations
              .filter((conversation) => {
                if (!conversation) return false;
                const info = getConversationInfo(conversation);
                if (!info) return false; // Filter out conversations with invalid data
                if (!searchQuery) return true;
                return info.name
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase());
              })
              .map((conversation, index) => {
                if (!conversation) return null;
                const info = getConversationInfo(conversation);
                if (!info) return null; // Skip invalid conversation info
                return (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-center px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => handleConversationSelect(conversation)}
                  >
                    {/* Avatar with unread indicator */}
                    <div className="relative flex-shrink-0 mr-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                        {info.avatar ? (
                          <img
                            src={`/assets/avatars/${info.avatar}`}
                            alt={info.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-black text-white font-medium text-lg">
                            {info.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {/* Online indicator */}
                      {conversation.type === "direct" &&
                        conversation.participants?.[0]?.user?.status ===
                          "online" && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                    </div>

                    {/* Message content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between mb-1">
                        <h3 className="font-semibold text-black truncate text-base">
                          {info.name}
                        </h3>
                        {conversation.last_message?.created_at && (
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {formatTime(conversation.last_message.created_at)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate pr-2">
                          {conversation.last_message ? (
                            <>
                              {conversation.last_message.is_own && (
                                <span className="text-gray-500">You: </span>
                              )}
                              {conversation.last_message.message_type === "text"
                                ? conversation.last_message.content || "Message"
                                : `${
                                    conversation.last_message.message_type
                                      ?.charAt(0)
                                      ?.toUpperCase() +
                                      conversation.last_message.message_type?.slice(
                                        1
                                      ) || "Message"
                                  } message`}
                            </>
                          ) : (
                            <span className="text-gray-400 italic">
                              {info.status}
                            </span>
                          )}
                        </p>

                        {/* Unread count badge */}
                        {conversation.unread_count &&
                          conversation.unread_count > 0 && (
                            <div className="flex-shrink-0 ml-2">
                              <div className="min-w-5 h-5 bg-black text-white text-xs rounded-full flex items-center justify-center px-1.5 font-medium">
                                {conversation.unread_count > 99
                                  ? "99+"
                                  : conversation.unread_count}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 bg-white">
            <div className="text-center max-w-xs">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-black mb-2">
                No Messages
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Select a contact above to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
