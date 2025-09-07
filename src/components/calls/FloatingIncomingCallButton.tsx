import React from "react";

interface FloatingIncomingCallButtonProps {
  onClick: () => void;
}

export const FloatingIncomingCallButton: React.FC<
  FloatingIncomingCallButtonProps
> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed right-6 bottom-20 z-50 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg p-4 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
      aria-label="Simulate Incoming Call"
      type="button"
    >
      <svg
        className="w-7 h-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 5l7 7-7 7M22 12H3"
        />
      </svg>
    </button>
  );
};
