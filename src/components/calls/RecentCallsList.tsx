import React from "react";
import { motion } from "framer-motion";
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

interface RecentCallsListProps {
  callLogs: CallLog[];
  onCall: (phone: string, name: string) => void;
  onMessage: (contactId: string) => void;
}

export const RecentCallsList: React.FC<RecentCallsListProps> = ({
  callLogs,
  onCall,
  onMessage,
}) => {
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
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days === 1) {
      return "Yesterday";
    } else {
      return d.toLocaleDateString();
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
      <div className="flex-1 overflow-y-auto">
        {callLogs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No recent calls
              </h3>
              <p className="text-gray-600">
                Your call history will appear here
              </p>
            </div>
          </div>
        ) : (
          callLogs.map((call, index) => (
            <motion.div
              key={call.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setSelectedCall(call)}
            >
              <Avatar
                src={call.contactAvatar}
                alt={call.contactName}
                size="md"
              />

              <div className="ml-3 flex-1">
                <div className="flex items-center">
                  <h3 className="font-medium text-black">{call.contactName}</h3>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <span>{formatTime(call.timestamp)}</span>
                  {call.duration && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{formatDuration(call.duration)}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="p-2 flex items-center justify-center">
                {getCallIcon(call.type)}
              </div>
            </motion.div>
          ))
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
                  onCall(selectedCall.contactPhone, selectedCall.contactName);
                  setSelectedCall(null);
                }}
                className="flex items-center justify-center space-x-2 p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                whileTap={{ scale: 0.95 }}
              >
                <Phone className="w-5 h-5" />
                <span>Call</span>
              </motion.button>

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
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
