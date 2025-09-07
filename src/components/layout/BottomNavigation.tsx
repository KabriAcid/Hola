import React from "react";
import { motion } from "framer-motion";
import { Phone, Users, MessageCircle, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { id: "calls", label: "Recents", icon: Phone, path: "/app/calls" },
  { id: "contacts", label: "Contacts", icon: Users, path: "/app/contacts" },
  {
    id: "messages",
    label: "Messages",
    icon: MessageCircle,
    path: "/app/messages",
  },
  { id: "settings", label: "Settings", icon: Settings, path: "/app/settings" },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-bottom">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <motion.button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                isActive ? "text-black" : "text-gray-400"
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <Icon
                className={`w-6 h-6 mb-1 ${isActive ? "stroke-2" : "stroke-1"}`}
              />
              <span
                className={`text-xs ${
                  isActive ? "font-medium" : "font-normal"
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-black rounded-full"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
