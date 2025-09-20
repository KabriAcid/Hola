import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  MessageCircle,
  Search,
  X,
} from "lucide-react";
import { CallLog } from "../../types";
import { Avatar } from "../ui/Avatar";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface RecentCallsListProps {
  onCall: (phone: string, name: string) => void;
  onMessage: (contactId: string) => void;
}

// iPhone-style call grouping: consecutive calls to/from same contact with same type get grouped
const groupCallsLikeIPhone = (calls: CallLog[]): CallLog[] => {
  if (calls.length === 0) return calls;

  const grouped: CallLog[] = [];
  let currentGroup: CallLog | null = null;
  let groupCount = 1;

  for (let i = 0; i < calls.length; i++) {
    const call = calls[i];

    if (
      currentGroup &&
      currentGroup.contactPhone === call.contactPhone &&
      currentGroup.type === call.type &&
      // Group if calls are within 1 hour of each other
      Math.abs(currentGroup.timestamp.getTime() - call.timestamp.getTime()) <
        60 * 60 * 1000
    ) {
      // Same contact, same type, within time window - increment count
      groupCount++;
      // Update the group with the most recent call's timestamp
      if (call.timestamp > currentGroup.timestamp) {
        currentGroup = { ...call, count: groupCount };
      }
    } else {
      // Different contact or type or too far apart - push current group and start new one
      if (currentGroup) {
        grouped.push({ ...currentGroup, count: groupCount });
      }
      currentGroup = call;
      groupCount = 1;
    }
  }

  // Push the last group
  if (currentGroup) {
    grouped.push({ ...currentGroup, count: groupCount });
  }

  return grouped;
};

export const RecentCallsList: React.FC<RecentCallsListProps> = ({
  onCall,
  onMessage,
}) => {
  const navigate = useNavigate();
  const [callLogs, setCallLogs] = React.useState<CallLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [searchQuery, setSearchQuery] = React.useState("");

  // Update current time every 30 seconds to refresh relative timestamps
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(timer);
  }, []);

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
        if (!res.ok) {
          throw new Error(
            `Failed to fetch call logs: ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      })
      .then((data) => {

        // Ensure data is an array
        if (!Array.isArray(data)) {
          console.warn("Call logs API returned non-array:", data);
          setCallLogs([]);
          setLoading(false);
          return;
        }

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

        // Group calls iPhone-style: consecutive calls to/from same contact with same type
        const groupedCalls = groupCallsLikeIPhone(mapped);
        setCallLogs(groupedCalls);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Call logs fetch error:", err);
        setError(err.message || "Error loading call logs");
        setLoading(false);
      });
  }, []);

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

  const formatTime = React.useCallback(
    (date: Date | string) => {
      if (!date) return "N/A";

      const d = typeof date === "string" ? new Date(date) : date;

      // Check if date is valid
      if (isNaN(d.getTime())) {
        return "Invalid date";
      }

      const now = currentTime; // Use state instead of new Date()
      const diff = now.getTime() - d.getTime();
      const absDiff = Math.abs(diff);
      const seconds = Math.floor(absDiff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      // iPhone-style time formatting
      if (seconds < 60) {
        return "Just now";
      } else if (minutes < 60) {
        return `${minutes}m ago`;
      } else if (hours < 24) {
        return `${hours}h ago`;
      } else if (days === 1) {
        return "Yesterday";
      } else if (days < 7) {
        // Show day of week for recent days
        return d.toLocaleDateString("en-US", { weekday: "long" });
      } else {
        // For older dates, show abbreviated format
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: now.getFullYear() !== d.getFullYear() ? "numeric" : undefined,
        });
      }
    },
    [currentTime]
  );

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Filter call logs based on search query
  const filteredCallLogs = React.useMemo(() => {
    if (!searchQuery.trim()) return callLogs;

    return callLogs.filter(
      (call) =>
        call.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        call.contactPhone.includes(searchQuery)
    );
  }, [callLogs, searchQuery]);

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <>
      {/* Search Header - Standardized */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search call history..."
            className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black text-sm"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-100">
          <div className="text-red-700 text-sm mb-2">{error}</div>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              // Retry the fetch logic here
              window.location.reload();
            }}
            className="text-red-600 text-sm hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-none">
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredCallLogs.length === 0 && searchQuery ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No matching calls
              </h3>
              <p className="text-gray-600 mb-4">
                No call history matches "{searchQuery}". Try a different search
                term.
              </p>
              <motion.button
                onClick={() => setSearchQuery("")}
                className="inline-block px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                whileTap={{ scale: 0.95 }}
              >
                Clear search
              </motion.button>
            </div>
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
                className="inline-block px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                whileTap={{ scale: 0.95 }}
              >
                Make your first call
              </motion.button>
            </div>
          </div>
        ) : (
          filteredCallLogs.map((call, index) => {
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
                onClick={() => onCall(call.contactPhone, call.contactName)}
              >
                <Avatar
                  src={`/assets/avatars/${call.contactAvatar}`}
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
                    {call.count && call.count > 1 && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                        ({call.count})
                      </span>
                    )}
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

                <div className="flex items-center space-x-2">
                  <button
                    className="p-2 flex items-center justify-center rounded-full transition-colors hover:bg-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMessage(call.contactId);
                    }}
                    aria-label="Message"
                    type="button"
                  >
                    <MessageCircle className="w-4 h-4 text-gray-600" />
                  </button>

                  <div className="relative">
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
                    {call.count && call.count > 1 && (
                      <div className="absolute -top-1 -right-1 flex">
                        {Array.from({
                          length: Math.min(call.count - 1, 2),
                        }).map((_, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-full border border-white ml-[-2px]"
                            style={{
                              backgroundColor:
                                call.type === "missed"
                                  ? "#ef4444"
                                  : call.type === "incoming"
                                  ? "#10b981"
                                  : "#3b82f6",
                              zIndex: 10 - i,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </>
  );
};
