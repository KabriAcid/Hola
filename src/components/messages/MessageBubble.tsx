import React from "react";
import { Message } from "../../types";
import MessageStatus from "./MessageStatus";

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
  const [sendingTimeout, setSendingTimeout] =
    React.useState<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    // Check if message is pending (no status entries or all are 'sent')
    const isPending =
      isOwn &&
      (!message.status ||
        message.status.length === 0 ||
        !message.status.some(
          (s) => s.status === "delivered" || s.status === "read"
        ));

    if (isPending) {
      const timeout = setTimeout(() => {
        setShowResend(true);
      }, 40000); // 40 seconds
      setSendingTimeout(timeout);
    } else {
      // Clear timeout if message is no longer pending
      if (sendingTimeout) {
        clearTimeout(sendingTimeout);
        setSendingTimeout(null);
      }
      setShowResend(false);
    }

    return () => {
      if (sendingTimeout) {
        clearTimeout(sendingTimeout);
      }
    };
  }, [message.status, isOwn, sendingTimeout]);

  const handleResend = () => {
    // Implement resend logic here
    setShowResend(false);
    // You can call a resend function passed as prop or emit a socket event
    console.log("Resending message:", message.id);
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
    switch (message.message_type) {
      case "text":
        return (
          <p className="break-words whitespace-pre-wrap">{message.content}</p>
        );
      case "image":
        return (
          <div className="max-w-xs">
            <img
              src={message.file_url}
              alt="Shared image"
              className="rounded-lg max-w-full h-auto"
              loading="lazy"
            />
            {message.content && (
              <p className="mt-2 break-words whitespace-pre-wrap">
                {message.content}
              </p>
            )}
          </div>
        );
      case "audio":
        return (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <audio controls className="w-full">
                <source src={message.file_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          </div>
        );
      case "file":
        return (
          <div className="flex items-center space-x-3 p-2 bg-white bg-opacity-10 rounded-lg">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.file_name}
              </p>
              <p className="text-xs opacity-75">
                {message.file_size
                  ? `${(message.file_size / 1024).toFixed(1)} KB`
                  : "File"}
              </p>
            </div>
            <a
              href={message.file_url}
              download={message.file_name}
              className="flex-shrink-0 p-1 hover:bg-white hover:bg-opacity-10 rounded"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
              </svg>
            </a>
          </div>
        );
      default:
        return <p className="break-words">{message.content}</p>;
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
          {!isOwn && message.sender && showAvatar && (
            <p className="text-xs font-medium text-gray-600 mb-1">
              {message.sender.full_name}
            </p>
          )}

          {/* Message content */}
          <div
            className={`text-sm ${
              message.message_type === "text" ? "" : "space-y-2"
            }`}
          >
            {renderMessageContent()}
          </div>

          {/* Reply indicator */}
          {message.reply_to_message_id && (
            <div className="mt-2 pt-2 border-t border-white border-opacity-20">
              <p className="text-xs opacity-75">Replying to a message</p>
            </div>
          )}

          {/* Time stamp in bottom right corner */}
          <div className="flex items-center justify-end mt-1">
            <span
              className={`text-xs ${isOwn ? "text-gray-500" : "text-gray-500"}`}
            >
              {formatTime(message.created_at)}
            </span>
          </div>

          {/* Timestamp on hover/tap */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {formatTime(message.created_at)}
            </div>
          </div>
        </div>
      </div>

      {/* External actions container for own messages */}
      {isOwn && (
        <div className="flex justify-end items-center mt-1 mr-2 space-x-2">
          {/* Show message status when sending */}
          {!showResend && (
            <>
              {/* Check if message is delivered/read to show edit and copy icons */}
              {message.status &&
                message.status.some(
                  (s) => s.status === "delivered" || s.status === "read"
                ) &&
                message.message_type === "text" && (
                  <>
                    {/* Edit icon */}
                    <button
                      onClick={() => {
                        // TODO: Implement edit functionality
                        console.log("Edit message:", message.id);
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit message"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    {/* Copy icon */}
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(message.content || "")
                      }
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy message"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </>
                )}
              <MessageStatus message={message} />
            </>
          )}

          {/* Show edit + copy + resend when timeout reached */}
          {showResend && (
            <>
              {message.message_type === "text" && (
                <>
                  {/* Edit icon */}
                  <button
                    onClick={() => {
                      // TODO: Implement edit functionality
                      console.log("Edit message:", message.id);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit message"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                  {/* Copy icon */}
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(message.content || "")
                    }
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copy message"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
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
