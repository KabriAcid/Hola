import React from "react";

interface TypingIndicatorProps {
  users: Array<{
    id: number;
    full_name: string;
    avatar?: string;
  }>;
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  users,
  className = "",
}) => {
  if (!users || users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].full_name} is typing...`;
    } else if (users.length === 2) {
      return `${users[0].full_name} and ${users[1].full_name} are typing...`;
    } else {
      return `${users[0].full_name} and ${
        users.length - 1
      } others are typing...`;
    }
  };

  return (
    <div className={`flex items-center space-x-3 px-4 py-2 ${className}`}>
      {/* User avatars */}
      <div className="flex -space-x-2">
        {users.slice(0, 3).map((user, index) => (
          <div
            key={user.id}
            className="w-6 h-6 rounded-full border-2 border-white bg-gray-300 overflow-hidden"
            style={{ zIndex: users.length - index }}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-xs font-medium">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Typing text with animated dots */}
      <div className="flex items-center space-x-1">
        <span className="text-sm text-gray-600">{getTypingText()}</span>

        {/* Animated dots */}
        <div className="flex space-x-1">
          <div
            className="w-1 h-1 bg-gray-600 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-1 h-1 bg-gray-600 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="w-1 h-1 bg-gray-600 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Alternative compact version for small spaces
interface CompactTypingIndicatorProps {
  isTyping: boolean;
  className?: string;
}

export const CompactTypingIndicator: React.FC<CompactTypingIndicatorProps> = ({
  isTyping,
  className = "",
}) => {
  if (!isTyping) return null;

  return (
    <div
      className={`flex items-center justify-start space-x-1 px-4 py-2 ${className}`}
    >
      <div className="flex items-center space-x-1 bg-gray-200 rounded-full px-3 py-2">
        <div
          className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        ></div>
        <div
          className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></div>
      </div>
    </div>
  );
};

export default TypingIndicator;
