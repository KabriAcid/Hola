import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell,
  Eye,
  Keyboard,
  Download,
  Archive,
  Volume2,
  Vibrate,
  Clock,
  Image,
  Video,
  FileText,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Header } from "../layout/Header";

interface ChatSettingsPageProps {}

interface SettingsRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  subtitle?: string;
  toggle?: boolean;
  onToggle?: (value: boolean) => void;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon: Icon,
  label,
  subtitle,
  toggle,
  onToggle,
  value,
  onPress,
  showArrow = false,
}) => {
  const handlePress = () => {
    if (onToggle && toggle !== undefined) {
      onToggle(!toggle);
    } else if (onPress) {
      onPress();
    }
  };

  return (
    <motion.button
      onClick={handlePress}
      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div className="p-2 rounded-full bg-gray-100">
          <Icon className="w-5 h-5 text-gray-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-black">{label}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 truncate">{subtitle}</p>
          )}
          {value && <p className="text-sm text-gray-500 truncate">{value}</p>}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {toggle !== undefined && (
          <div
            className={`w-12 h-6 rounded-full transition-colors ${
              toggle ? "bg-black" : "bg-gray-300"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                toggle ? "translate-x-6" : "translate-x-0.5"
              } mt-0.5`}
            />
          </div>
        )}
      </div>
    </motion.button>
  );
};

const SettingsSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white mb-6 rounded-lg shadow-sm"
  >
    <div className="px-6 py-3 border-b border-gray-100">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        {title}
      </h3>
    </div>
    <div className="divide-y divide-gray-100">{children}</div>
  </motion.div>
);

export const ChatSettingsPage: React.FC<ChatSettingsPageProps> = () => {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    messageNotifications: true,
    notificationSound: true,
    vibration: true,
    readReceipts: true,
    typingIndicators: true,
    autoDownloadPhotos: true,
    autoDownloadVideos: false,
    autoDownloadDocuments: false,
    autoDownloadOnWifi: true,
    chatBackup: true,
    backupFrequency: "daily",
    messagePreview: true,
    groupNotifications: true,
  });

  const updateSetting = (key: string, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <Header
        title="Chat & Messaging"
        showBack
        onBack={() => navigate("/settings")}
      />

      <div className="px-4 pt-4 pb-20">
        {/* Notifications */}
        <SettingsSection title="Notifications">
          <SettingsRow
            icon={Bell}
            label="Message Notifications"
            subtitle="Get notified about new messages"
            toggle={settings.messageNotifications}
            onToggle={(value) => updateSetting("messageNotifications", value)}
          />
          <SettingsRow
            icon={Volume2}
            label="Notification Sound"
            subtitle="Play sound for new messages"
            toggle={settings.notificationSound}
            onToggle={(value) => updateSetting("notificationSound", value)}
          />
          <SettingsRow
            icon={Vibrate}
            label="Vibration"
            subtitle="Vibrate for new messages"
            toggle={settings.vibration}
            onToggle={(value) => updateSetting("vibration", value)}
          />
          <SettingsRow
            icon={Eye}
            label="Message Preview"
            subtitle="Show message content in notifications"
            toggle={settings.messagePreview}
            onToggle={(value) => updateSetting("messagePreview", value)}
          />
          <SettingsRow
            icon={Bell}
            label="Group Notifications"
            subtitle="Get notified about group messages"
            toggle={settings.groupNotifications}
            onToggle={(value) => updateSetting("groupNotifications", value)}
          />
        </SettingsSection>

        {/* Message Features */}
        <SettingsSection title="Message Features">
          <SettingsRow
            icon={Eye}
            label="Read Receipts"
            subtitle="Let others know when you've read their messages"
            toggle={settings.readReceipts}
            onToggle={(value) => updateSetting("readReceipts", value)}
          />
          <SettingsRow
            icon={Keyboard}
            label="Typing Indicators"
            subtitle="Show when you're typing a message"
            toggle={settings.typingIndicators}
            onToggle={(value) => updateSetting("typingIndicators", value)}
          />
        </SettingsSection>

        {/* Auto-Download */}
        <SettingsSection title="Auto-Download Media">
          <SettingsRow
            icon={Image}
            label="Photos"
            subtitle="Automatically download photos"
            toggle={settings.autoDownloadPhotos}
            onToggle={(value) => updateSetting("autoDownloadPhotos", value)}
          />
          <SettingsRow
            icon={Video}
            label="Videos"
            subtitle="Automatically download videos"
            toggle={settings.autoDownloadVideos}
            onToggle={(value) => updateSetting("autoDownloadVideos", value)}
          />
          <SettingsRow
            icon={FileText}
            label="Documents"
            subtitle="Automatically download documents"
            toggle={settings.autoDownloadDocuments}
            onToggle={(value) => updateSetting("autoDownloadDocuments", value)}
          />
          <SettingsRow
            icon={Wifi}
            label="Only on Wi-Fi"
            subtitle="Download media only when connected to Wi-Fi"
            toggle={settings.autoDownloadOnWifi}
            onToggle={(value) => updateSetting("autoDownloadOnWifi", value)}
          />
        </SettingsSection>

        {/* Backup */}
        <SettingsSection title="Chat Backup">
          <SettingsRow
            icon={Archive}
            label="Chat Backup"
            subtitle="Back up your messages to cloud storage"
            toggle={settings.chatBackup}
            onToggle={(value) => updateSetting("chatBackup", value)}
          />
          <SettingsRow
            icon={Clock}
            label="Backup Frequency"
            value="Daily"
            onPress={() => console.log("Select backup frequency")}
          />
        </SettingsSection>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 rounded-lg p-4"
        >
          <h4 className="font-medium text-blue-900 mb-2">
            About Chat Settings
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              • Read receipts are mutual - if you turn them off, you won't see
              others' either
            </li>
            <li>
              • Auto-download uses your data plan unless restricted to Wi-Fi
            </li>
            <li>• Chat backups help you restore messages on new devices</li>
            <li>• Notification settings can be customized per chat</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};
