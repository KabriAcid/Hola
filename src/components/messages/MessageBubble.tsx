import React from "react";
import { Message } from "../../types";
import MessageStatus from "./MessageStatus";
import { Edit, Copy, Play, FileText, Download } from "lucide-react";
import { socketService } from "../../socket";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  isGrouped?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = false,
  showTimestamp = false,
  isGrouped = false,
}) => {
  // Track message sending timeout
  const [showResend, setShowResend] = React.useState(false);
  const [currentMessage, setCurrentMessage] = React.useState(message);

  // Update local message state when props change
  React.useEffect(() => {
    setCurrentMessage(message);
  }, [message]);

  // Listen for real-time status updates
  React.useEffect(() => {
    if (!isOwn) return;

    const cleanup = socketService.onMessageStatusUpdate((update) => {
      if (update.messageId === currentMessage.id) {
        setCurrentMessage((prev) => ({
          ...prev,
          status: prev.status
            ? [
                ...prev.status.filter((s: any) => s.user_id !== update.userId),
                {
                  id: Date.now(),
                  message_id: update.messageId,
                  user_id: update.userId,
                  status: update.status,
                  timestamp: update.timestamp,
                },
              ]
            : [
                {
                  id: Date.now(),
                  message_id: update.messageId,
                  user_id: update.userId,
                  status: update.status,
                  timestamp: update.timestamp,
                },
              ],
        }));
      }
    });

    return cleanup;
  }, [isOwn, currentMessage.id]);

  const handleResend = () => {
    setShowResend(false);
    console.log("Resending message:", currentMessage.id);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) {
      return date.toLocaleDateString("en-US", { weekday: "long" });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const renderMessageContent = () => {
    switch (currentMessage.message_type) {
      case "text":
        return (
          <p className="break-words whitespace-pre-wrap">
            {currentMessage.content}
          </p>
        );
      case "image":
        return (
          <div className="max-w-xs">
            <img
              src={currentMessage.file_url}
              alt="Shared image"
              className="rounded-lg max-w-full h-auto"
              loading="lazy"
            />
            {currentMessage.content && (
              <p className="mt-2 break-words whitespace-pre-wrap">
                {currentMessage.content}
              </p>
            )}
          </div>
        );
      case "audio":
        return (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <Play className="w-4 h-4 fill-current" />
              </div>
            </div>
            <div className="flex-1">
              <audio controls className="w-full">
                <source src={currentMessage.file_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        );
      case "file":
        return (
          <div className="flex items-center space-x-3 p-2 bg-white bg-opacity-10 rounded-lg">
            <div className="flex-shrink-0">
              <FileText className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {currentMessage.file_name}
              </p>
              <p className="text-xs opacity-75">
                {currentMessage.file_size
                  ? `${(currentMessage.file_size / 1024).toFixed(1)} KB`
                  : "File"}
              </p>
            </div>
            <a
              href={currentMessage.file_url}
              download={currentMessage.file_name}
              className="flex-shrink-0 p-1 hover:bg-white hover:bg-opacity-10 rounded"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        );
      default:
        return <p className="break-words">{currentMessage.content}</p>;
    }
  };

  return (
    <div
      className={`flex flex-col ${isOwn ? "items-end" : "items-start"} mb-1`}
    >
      {/* Date separator */}
      {showTimestamp && (
        <div className="text-xs text-gray-500 text-center w-full mb-2">
          {formatDate(message.created_at)}
        </div>
      )}

      <div
        className={`flex items-end space-x-2 max-w-xs sm:max-w-md ${
          isOwn ? "flex-row-reverse space-x-reverse" : ""
        }`}
      >
        {/* Avatar */}
        {showAvatar && !isOwn && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
            {message.sender?.avatar ? (
              <img
                src={message.sender.avatar}
                alt={message.sender.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-xs font-medium">
                {message.sender?.full_name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`
            relative px-4 py-2 rounded-2xl max-w-full
            ${
              isOwn
                ? "bg-white text-black rounded-br-md shadow-md"
                : "bg-gray-200 text-gray-900 rounded-bl-md"
            }
            ${isGrouped ? (isOwn ? "rounded-tr-2xl" : "rounded-tl-2xl") : ""}
          `}
        >
          {/* Sender name for group chats */}
          {!isOwn && currentMessage.sender && showAvatar && (
            <p className="text-xs font-medium text-gray-600 mb-1">
              {currentMessage.sender.full_name}
            </p>
          )}

          {/* Message content */}
          <div
            className={`text-sm ${
              currentMessage.message_type === "text" ? "" : "space-y-2"
            }`}
          >
            {renderMessageContent()}
          </div>

          {/* Reply indicator */}
          {currentMessage.reply_to_message_id && (
            <div className="mt-2 pt-2 border-t border-white border-opacity-20">
              <p className="text-xs opacity-75">Replying to a message</p>
            </div>
          )}

          {/* Time stamp in bottom right corner */}
          <div className="flex items-center justify-end mt-1">
            <span
              className={`text-xs ${isOwn ? "text-gray-500" : "text-gray-500"}`}
            >
              {formatTime(currentMessage.created_at)}
            </span>
          </div>

          {/* Timestamp on hover/tap */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {formatTime(currentMessage.created_at)}
            </div>
          </div>
        </div>
      </div>

      {/* External actions container for own messages */}
      {isOwn && (
        <div className="flex justify-end items-center mt-1 mr-2 space-x-2">
          {/* Show message status when not showing resend */}
          {!showResend && (
            <>
              {/* Show edit and copy icons for text messages */}
              {currentMessage.message_type === "text" && (
                <>
                  {/* Edit icon */}
                  <button
                    onClick={() => {
                      // TODO: Implement edit functionality
                      console.log("Edit message:", currentMessage.id);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit message"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  {/* Copy icon */}
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        currentMessage.content || ""
                      )
                    }
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy message"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </>
              )}
              <MessageStatus message={currentMessage} />
            </>
          )}

          {/* Show edit + copy + resend when timeout reached */}
          {showResend && (
            <>
              {currentMessage.message_type === "text" && (
                <>
                  {/* Edit icon */}
                  <button
                    onClick={() => {
                      // TODO: Implement edit functionality
                      console.log("Edit message:", currentMessage.id);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit message"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  {/* Copy icon */}
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        currentMessage.content || ""
                      )
                    }
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy message"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </>
              )}
              <button
                onClick={handleResend}
                className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                title="Resend message"
              >
                Resend
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
