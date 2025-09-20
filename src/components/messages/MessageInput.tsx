import React, { useState, useRef, useEffect } from "react";

interface MessageInputProps {
  onSendMessage: (
    content: string,
    messageType?: "text" | "image" | "audio" | "file"
  ) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = "Type a message...",
}) => {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  // Handle typing indicators
  useEffect(() => {
    if (onTyping) {
      onTyping(isTyping);
    }
  }, [isTyping, onTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    // Limit to 10,000 characters
    if (value.length > 10000) {
      return;
    }

    setMessage(value);

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) return;

    onSendMessage(trimmedMessage, "text");
    setMessage("");
    setIsTyping(false);

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a preview or handle file upload
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;

      // Determine message type based on file type
      let messageType: "image" | "audio" | "file" = "file";
      if (file.type.startsWith("image/")) {
        messageType = "image";
      } else if (file.type.startsWith("audio/")) {
        messageType = "audio";
      }

      // For now, we'll just send the file name as content
      // In a real implementation, you'd upload the file first
      onSendMessage(file.name, messageType);
    };

    if (file.type.startsWith("image/") || file.type.startsWith("audio/")) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }

    // Reset file input
    e.target.value = "";
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="border-t bg-white px-4 py-2 flex-shrink-0">
      <form onSubmit={handleSubmit} className="relative">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Message input container with fixed icons */}
        <div className="relative">
          {/* File upload button - positioned absolute left */}
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={disabled}
            className="absolute left-3 bottom-2.5 z-10 w-8 h-8 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
              />
            </svg>
          </button>

          {/* Textarea with padding for icons */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={10000}
            className="w-full pl-12 pr-13 py-2.5 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-black disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px] max-h-[80px] overflow-y-auto scrollbar-none"
            rows={1}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          />

          {/* Send button - positioned absolute right */}
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className="absolute right-3 bottom-2.5 z-10 w-8 h-8 bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white rounded-full transition-colors duration-200 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <svg
              className="w-4 h-4 transform rotate-45"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </form>

      {/* Character count */}
      {message.length > 0 && (
        <div
          className={`mt-1 text-xs text-right px-1 ${
            message.length > 9500
              ? "text-red-500"
              : message.length > 9000
              ? "text-orange-500"
              : message.length > 8000
              ? "text-yellow-600"
              : "text-gray-500"
          }`}
        >
          {message.length.toLocaleString()}/10,000
        </div>
      )}
    </div>
  );
};

export default MessageInput;
