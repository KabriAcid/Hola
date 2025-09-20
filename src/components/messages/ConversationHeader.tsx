import React from "react";
import { Avatar } from "../ui/Avatar";

interface ConversationHeaderProps {
  conversation: {
    id: number;
    type: "direct" | "group";
    name?: string;
    avatar?: string;
    participants?: Array<{
      id: number;
      full_name: string;
      avatar?: string;
      status?: "online" | "offline" | "away" | "busy";
      last_seen?: string;
    }>;
  };
  onBack?: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
  onInfo?: () => void;
}

const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  conversation,
  onBack,
  onCall,
  onVideoCall,
  onInfo,
}) => {
  const getDisplayName = () => {
    if (conversation.type === "group") {
      return conversation.name || "Group Chat";
    }

    if (conversation.participants && conversation.participants.length > 0) {
      const otherParticipant = conversation.participants[0];
      return otherParticipant.full_name;
    }

    return "Unknown";
  };

  const getDisplayAvatar = () => {
    if (conversation.type === "group") {
      return conversation.avatar;
    }

    if (conversation.participants && conversation.participants.length > 0) {
      return conversation.participants[0].avatar;
    }

    return undefined;
  };

  const getStatusText = () => {
    if (conversation.type === "group") {
      const participantCount = conversation.participants?.length || 0;
      return `${participantCount} participants`;
    }

    if (conversation.participants && conversation.participants.length > 0) {
      const participant = conversation.participants[0];

      if (participant.status === "online") {
        return "Online";
      } else if (participant.status === "away") {
        return "Away";
      } else if (participant.status === "busy") {
        return "Busy";
      } else if (participant.last_seen) {
        const lastSeen = new Date(participant.last_seen);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - lastSeen.getTime());
        const diffMinutes = Math.ceil(diffTime / (1000 * 60));
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffMinutes < 5) {
          return "Last seen just now";
        } else if (diffMinutes < 60) {
          return `Last seen ${diffMinutes}m ago`;
        } else if (diffHours < 24) {
          return `Last seen ${diffHours}h ago`;
        } else if (diffDays < 7) {
          return `Last seen ${diffDays}d ago`;
        } else {
          return "Last seen a while ago";
        }
      }
    }

    return "Offline";
  };

  const getStatusColor = () => {
    if (conversation.type === "group") {
      return "text-gray-500";
    }

    if (conversation.participants && conversation.participants.length > 0) {
      const status = conversation.participants[0].status;

      switch (status) {
        case "online":
          return "text-green-500";
        case "away":
          return "text-yellow-500";
        case "busy":
          return "text-red-500";
        default:
          return "text-gray-500";
      }
    }

    return "text-gray-500";
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Back button and user info */}
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {/* Back button */}
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <svg
                className="w-6 h-6 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* Avatar */}
          <div className="flex-shrink-0 relative">
            <Avatar
              src={getDisplayAvatar()}
              alt={getDisplayName()}
              size="md"
              isOnline={
                conversation.type === "direct" &&
                conversation.participants?.[0]?.status === "online"
              }
            />
          </div>

          {/* Name and status */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-black truncate">
              {getDisplayName()}
            </h2>
            <p className={`text-sm ${getStatusColor()} truncate`}>
              {getStatusText()}
            </p>
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center space-x-2">
          {/* Audio call button */}
          {onCall && (
            <button
              onClick={onCall}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              title="Voice call"
            >
              <svg
                className="w-5 h-5 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </button>
          )}

          {/* Video call button */}
          {onVideoCall && (
            <button
              onClick={onVideoCall}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              title="Video call"
            >
              <svg
                className="w-5 h-5 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          )}

          {/* Info button */}
          {onInfo && (
            <button
              onClick={onInfo}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              title="Conversation info"
            >
              <svg
                className="w-5 h-5 text-black"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationHeader;
