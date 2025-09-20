import React from "react";
import { Message } from "../../types";
import { Check, CheckCheck } from "lucide-react";

interface MessageStatusProps {
  message: Message;
  className?: string;
}

const MessageStatus: React.FC<MessageStatusProps> = ({
  message,
  className = "",
}) => {
  // Don't show status for received messages
  if (!message.is_own) return null;

  const getStatusInfo = () => {
    // Check if message has status information
    if (!message.status || message.status.length === 0) {
      return {
        text: "Sending...",
        icon: "sending",
        color: "text-gray-400",
      };
    }

    // Get the latest status
    const latestStatus = message.status.reduce((latest, current) => {
      return new Date(current.timestamp) > new Date(latest.timestamp)
        ? current
        : latest;
    });

    switch (latestStatus.status) {
      case "sent":
        return {
          text: "Sent",
          icon: "sent",
          color: "text-gray-400",
        };
      case "delivered":
        return {
          text: "Received",
          icon: "delivered",
          color: "text-gray-400",
        };
      case "read":
        return {
          text: "Read",
          icon: "read",
          color: "text-green-500",
        };
      default:
        return {
          text: "Sending...",
          icon: "sending",
          color: "text-gray-400",
        };
    }
  };

  const renderStatusIcon = (icon: string, color: string) => {
    switch (icon) {
      case "sending":
        return (
          <div className={`w-3 h-3 ${color}`}>
            <svg
              className="animate-spin"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        );
      case "sent":
        return <Check className={`w-3 h-3 ${color}`} />;
      case "delivered":
        return <span className={`text-xs ${color}`}>received</span>;
      case "read":
        return <Check className={`w-3 h-3 ${color}`} />;
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`flex items-center justify-end space-x-1 ${className}`}>
      {renderStatusIcon(statusInfo.icon, statusInfo.color)}
    </div>
  );
};

export default MessageStatus;
