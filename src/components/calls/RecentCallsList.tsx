import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  MessageCircle,
} from "lucide-react";
import { CallLog } from "../../types";
import { Avatar } from "../ui/Avatar";
import { Modal } from "../ui/Modal";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface RecentCallsListProps {
  onCall: (phone: string, name: string) => void;
  onMessage: (contactId: string) => void;
}

export const RecentCallsList: React.FC<RecentCallsListProps> = ({
  onCall,
  onMessage,
}) => {
  const navigate = useNavigate();
  const [callLogs, setCallLogs] = React.useState<CallLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("jwt");
    fetch("/api/call-logs", {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch call logs");
        return res.json();
      })
      .then((data) => {
        // Backend now returns properly formatted data
        const mapped = data.map((item: any) => ({
          id: String(item.id),
          contactId: String(item.contactId),
          contactName: item.contactName,
          contactPhone: item.contactPhone,
          contactAvatar: item.contactAvatar,
          type: item.type as "incoming" | "outgoing" | "missed",
          duration: item.duration,
          timestamp: new Date(item.timestamp), // Convert string to Date
        }));
        setCallLogs(mapped);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Error loading call logs");
        setLoading(false);
      });
  }, []);
  const [selectedCall, setSelectedCall] = React.useState<CallLog | null>(null);

  const getCallIcon = (type: CallLog["type"]) => {
    switch (type) {
      case "incoming":
        return <PhoneIncoming className="w-4 h-4 text-green-600" />;
      case "outgoing":
        return <PhoneOutgoing className="w-4 h-4 text-blue-600" />;
      case "missed":
        return <PhoneMissed className="w-4 h-4 text-red-600" />;
    }
  };

  const formatTime = (date: Date | string) => {
    if (!date) return "Unknown time";

    const d = typeof date === "string" ? new Date(date) : date;

    // Check if date is valid
    if (isNaN(d.getTime())) {
      return "Invalid date";
    }

    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (seconds < 30) {
      return "Just now";
    } else if (seconds < 60) {
      return `${seconds} seconds ago`;
    } else if (minutes === 1) {
      return "1 minute ago";
    } else if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (hours === 1) {
      return "1 hour ago";
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else if (weeks === 1) {
      return "1 week ago";
    } else if (weeks < 4) {
      return `${weeks} weeks ago`;
    } else {
      // For older dates, use MM/DD/YYYY format
      return d.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto scrollbar-none">
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center text-red-500">{error}</div>
          </div>
        ) : callLogs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No recent calls
              </h3>
              <p className="text-gray-600 mb-4">
                You have no call history yet. Add your first contact to start
                calling!
              </p>
              <motion.button
                onClick={() => navigate("/app/contacts")}
                className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                whileTap={{ scale: 0.95 }}
              >
                Make your first call
              </motion.button>
            </div>
          </div>
        ) : (
          callLogs.map((call, index) => {
            const isMissed = call.type === "missed";
            return (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center p-4 border-b border-gray-100 transition-colors cursor-pointer ${
                  isMissed
                    ? "bg-red-50 hover:bg-red-100"
                    : "bg-white hover:bg-gray-50"
                }`}
                onClick={() => setSelectedCall(call)}
              >
                <Avatar
                  src={call.contactAvatar}
                  alt={call.contactName}
                  size="md"
                />

                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <h3
                      className={`font-medium ${
                        isMissed ? "text-red-700" : "text-black"
                      }`}
                    >
                      {call.contactName}
                    </h3>
                    {isMissed && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-red-200 text-red-800 rounded-full">
                        Missed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span>{formatTime(call.timestamp)}</span>
                    {!!(call.duration && call.duration > 0 && !isMissed) && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{formatDuration(call.duration)}</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  className={`p-2 flex items-center justify-center rounded-full transition-colors ${
                    isMissed ? "hover:bg-red-200" : "hover:bg-gray-200"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCall(call.contactPhone, call.contactName);
                  }}
                  aria-label="Call"
                  type="button"
                >
                  {getCallIcon(call.type)}
                </button>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Call Action Modal */}
      <Modal
        isOpen={!!selectedCall}
        onClose={() => setSelectedCall(null)}
        title="Contact Options"
      >
        {selectedCall && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-6">
              <Avatar
                src={selectedCall.contactAvatar}
                alt={selectedCall.contactName}
                size="lg"
              />
              <div>
                <h3 className="font-semibold text-lg">
                  {selectedCall.contactName}
                </h3>
                <p className="text-gray-600">{selectedCall.contactPhone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                onClick={() => {
                  onMessage(selectedCall.contactId);
                  setSelectedCall(null);
                }}
                className="flex items-center justify-center space-x-2 p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <MessageCircle className="w-5 h-5" />
                <span>Message</span>
              </motion.button>
              <motion.button
                onClick={() => {
                  onCall(selectedCall.contactPhone, selectedCall.contactName);
                  setSelectedCall(null);
                }}
                className="flex items-center justify-center space-x-2 p-4 bg-primary text-white rounded-lg hover:bg-gray-900 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <Phone className="w-5 h-5" />
                <span>Call</span>
              </motion.button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
