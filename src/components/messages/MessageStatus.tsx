import React from "react";
import { Message } from "../../types";

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
          text: "Delivered",
          icon: "delivered",
          color: "text-gray-500",
        };
      case "read":
        return {
          text: "Read",
          icon: "read",
          color: "text-black",
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
        return (
          <svg
            className={`w-3 h-3 ${color}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        );
      case "delivered":
        return (
          <svg
            className={`w-3 h-3 ${color}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
          </svg>
        );
      case "read":
        return (
          <div className="flex -space-x-1">
            <svg
              className={`w-3 h-3 ${color}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
            </svg>
            <svg
              className={`w-3 h-3 ${color} -ml-1`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div
      className={`flex items-center justify-end space-x-1 mt-1 ${className}`}
    >
      <span className={`text-xs ${statusInfo.color}`}>{statusInfo.text}</span>
      {renderStatusIcon(statusInfo.icon, statusInfo.color)}
    </div>
  );
};

// Simplified version that only shows icons
export const MessageStatusIcon: React.FC<MessageStatusProps> = ({
  message,
  className = "",
}) => {
  if (!message.is_own) return null;

  const getStatusInfo = () => {
    if (!message.status || message.status.length === 0) {
      return { icon: "sending", color: "text-gray-400" };
    }

    const latestStatus = message.status.reduce((latest, current) => {
      return new Date(current.timestamp) > new Date(latest.timestamp)
        ? current
        : latest;
    });

    switch (latestStatus.status) {
      case "sent":
        return { icon: "sent", color: "text-gray-400" };
      case "delivered":
        return { icon: "delivered", color: "text-gray-500" };
      case "read":
        return { icon: "read", color: "text-black" };
      default:
        return { icon: "sending", color: "text-gray-400" };
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
        return (
          <svg
            className={`w-3 h-3 ${color}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        );
      case "delivered":
        return (
          <svg
            className={`w-3 h-3 ${color}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
          </svg>
        );
      case "read":
        return (
          <div className="flex -space-x-1">
            <svg
              className={`w-3 h-3 ${color}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
            </svg>
            <svg
              className={`w-3 h-3 ${color} -ml-1`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`flex items-center justify-end mt-1 ${className}`}>
      {renderStatusIcon(statusInfo.icon, statusInfo.color)}
    </div>
  );
};

export default MessageStatus;
