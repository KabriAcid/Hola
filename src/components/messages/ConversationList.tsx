import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import { MessageCircle, Search, X } from "lucide-react";
import { Contact, Conversation } from "../../types";
import { Avatar } from "../ui/Avatar";
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
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
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

  // Search contacts for new conversation
  const performSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const filtered = contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(query.toLowerCase()) ||
          contact.phone.includes(query)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error("Error searching contacts:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation: Conversation) => {
    onSelectConversation(conversation.id);
  };

  // Handle starting new conversation
  const handleStartNewConversation = (contact: Contact) => {
    if (onStartNewConversation) {
      onStartNewConversation(Number(contact.id));
    }
    setShowNewChat(false);
    setSearchQuery("");
    setSearchResults([]);
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
      return {
        name: "Unknown",
        avatar: undefined,
        status: "Offline",
      };
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
    return {
      name: otherParticipant?.user?.full_name || "Unknown",
      avatar: otherParticipant?.user?.avatar,
      status:
        otherParticipant?.user?.status === "online" ? "Online" : "Offline",
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

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with New Chat Button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <button
          onClick={() => setShowNewChat(true)}
          className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>
      </div>

      {/* Search for existing conversations */}
      <div className="p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search conversations..."
            className="block w-full pl-10 py-3 border border-gray-300 rounded-full leading-5 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-0 text-base"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500">Loading conversations...</div>
          </div>
        ) : conversations && conversations.length > 0 ? (
          conversations
            .filter((conversation) => {
              if (!conversation) return false;
              if (!searchQuery) return true;
              const info = getConversationInfo(conversation);
              return info.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            })
            .map((conversation, index) => {
              if (!conversation) return null;
              const info = getConversationInfo(conversation);
              return (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                  onClick={() => handleConversationSelect(conversation)}
                >
                  <div className="relative">
                    <Avatar
                      src={
                        info.avatar
                          ? `/assets/avatars/${info.avatar}`
                          : undefined
                      }
                      alt={info.name}
                      size="lg"
                      isOnline={
                        conversation.type === "direct" &&
                        conversation.participants?.[0]?.user?.status ===
                          "online"
                      }
                    />
                    {conversation.unread_count &&
                      conversation.unread_count > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                          {conversation.unread_count > 9
                            ? "9+"
                            : conversation.unread_count}
                        </div>
                      )}
                  </div>

                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {info.name}
                      </h3>
                      {conversation.last_message?.created_at && (
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.last_message.created_at)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message ? (
                          <>
                            {conversation.last_message.is_own && "You: "}
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
                          info.status
                        )}
                      </p>

                      {conversation.unread_count &&
                        conversation.unread_count > 0 && (
                          <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                    </div>
                  </div>
                </motion.div>
              );
            })
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                No conversations yet
              </h3>
              <p className="text-gray-600 max-w-sm mx-auto mb-6">
                Start messaging your contacts to see conversations here
              </p>
              <button
                onClick={() => setShowNewChat(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              >
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">New Chat</h2>
              <button
                onClick={() => {
                  setShowNewChat(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search contacts..."
                  className="block w-full pl-10 py-3 border border-gray-300 rounded-lg leading-5 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-0"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-96">
              {isSearching ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-gray-500">Searching...</div>
                </div>
              ) : searchQuery ? (
                searchResults.length > 0 ? (
                  searchResults.map((contact, index) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                      onClick={() => handleStartNewConversation(contact)}
                    >
                      <Avatar
                        src={
                          contact.avatar
                            ? `/assets/avatars/${contact.avatar}`
                            : undefined
                        }
                        alt={contact.name}
                        size="md"
                        isOnline={contact.isOnline}
                      />
                      <div className="ml-3 flex-1">
                        <h3 className="font-medium text-gray-900">
                          {contact.name}
                        </h3>
                        <p className="text-sm text-gray-600">{contact.phone}</p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No contacts found</p>
                    </div>
                  </div>
                )
              ) : (
                contacts.map((contact, index) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                    onClick={() => handleStartNewConversation(contact)}
                  >
                    <Avatar
                      src={
                        contact.avatar
                          ? `/assets/avatars/${contact.avatar}`
                          : undefined
                      }
                      alt={contact.name}
                      size="md"
                      isOnline={contact.isOnline}
                    />
                    <div className="ml-3 flex-1">
                      <h3 className="font-medium text-gray-900">
                        {contact.name}
                      </h3>
                      <p className="text-sm text-gray-600">{contact.phone}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
