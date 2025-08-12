import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Bell, Shield, Palette, LogOut } from "lucide-react";

export const Settings: React.FC = () => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white h-full p-6"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Settings</h2>

      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-accent-blue-100 text-accent-blue-700 flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="font-medium text-gray-900">John Doe</p>
            <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-800">Notifications</span>
            </div>
            <button
              onClick={() => setNotifications((v) => !v)}
              className={`px-3 py-1 rounded-full text-sm ${
                notifications
                  ? "bg-primary-100 text-primary-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {notifications ? "On" : "Off"}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Palette className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-800">Dark Mode</span>
            </div>
            <button
              onClick={() => setDarkMode((v) => !v)}
              className={`px-3 py-1 rounded-full text-sm ${
                darkMode
                  ? "bg-primary-100 text-primary-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {darkMode ? "On" : "Off"}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <Shield className="w-5 h-5 text-gray-600" />
            <span className="text-gray-800">Privacy & Security</span>
          </div>
        </div>

        <div className="pt-4">
          <button className="w-full flex items-center justify-center space-x-2 text-red-600 font-medium border border-red-200 rounded-xl py-3 hover:bg-red-50">
            <LogOut className="w-5 h-5" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
