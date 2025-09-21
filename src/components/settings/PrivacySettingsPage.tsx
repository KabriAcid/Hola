import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UserX,
  EyeOff,
  User,
  MessageCircle,
  Lock,
  Shield,
  Eye,
  Clock,
  Image,
  ChevronRight,
} from "lucide-react";
import { Header } from "../layout/Header";

interface PrivacySettingsPageProps {}

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
        {showArrow && <ChevronRight className="w-5 h-5 text-gray-400" />}
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

export const PrivacySettingsPage: React.FC<PrivacySettingsPageProps> = () => {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    lastSeenPrivacy: "everyone",
    profilePhotoPrivacy: "contacts",
    statusPrivacy: "contacts",
    readReceiptsPrivacy: "everyone",
    twoStepVerification: false,
    blockedContactsCount: 3,
    onlineStatusVisible: true,
    typingIndicatorVisible: true,
  });

  const updateSetting = (key: string, value: boolean | string | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const getPrivacyLabel = (value: string) => {
    switch (value) {
      case "everyone":
        return "Everyone";
      case "contacts":
        return "My Contacts";
      case "nobody":
        return "Nobody";
      default:
        return value;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <Header
        title="Privacy & Security"
        showBack
        onBack={() => navigate("/settings")}
      />

      <div className="px-4 pt-4 pb-20">
        {/* Blocked Contacts */}
        <SettingsSection title="Blocked Contacts">
          <SettingsRow
            icon={UserX}
            label="Blocked Contacts"
            subtitle={`${settings.blockedContactsCount} blocked contacts`}
            onPress={() => navigate("/settings/blocked-contacts")}
            showArrow
          />
        </SettingsSection>

        {/* Who Can See My Info */}
        <SettingsSection title="Who Can See My Info">
          <SettingsRow
            icon={Clock}
            label="Last Seen"
            value={getPrivacyLabel(settings.lastSeenPrivacy)}
            onPress={() => navigate("/settings/last-seen-privacy")}
            showArrow
          />
          <SettingsRow
            icon={Image}
            label="Profile Photo"
            value={getPrivacyLabel(settings.profilePhotoPrivacy)}
            onPress={() => navigate("/settings/profile-photo-privacy")}
            showArrow
          />
          <SettingsRow
            icon={MessageCircle}
            label="Status"
            value={getPrivacyLabel(settings.statusPrivacy)}
            onPress={() => navigate("/settings/status-privacy")}
            showArrow
          />
          <SettingsRow
            icon={Eye}
            label="Read Receipts"
            value={getPrivacyLabel(settings.readReceiptsPrivacy)}
            onPress={() => navigate("/settings/read-receipts-privacy")}
            showArrow
          />
        </SettingsSection>

        {/* Online Activity */}
        <SettingsSection title="Online Activity">
          <SettingsRow
            icon={User}
            label="Online Status"
            subtitle="Show when you're online"
            toggle={settings.onlineStatusVisible}
            onToggle={(value) => updateSetting("onlineStatusVisible", value)}
          />
          <SettingsRow
            icon={EyeOff}
            label="Typing Indicator"
            subtitle="Show when you're typing"
            toggle={settings.typingIndicatorVisible}
            onToggle={(value) => updateSetting("typingIndicatorVisible", value)}
          />
        </SettingsSection>

        {/* Security */}
        <SettingsSection title="Security">
          <SettingsRow
            icon={Lock}
            label="Two-Step Verification"
            subtitle="Add extra security to your account"
            toggle={settings.twoStepVerification}
            onToggle={(value) => updateSetting("twoStepVerification", value)}
          />
          <SettingsRow
            icon={Shield}
            label="Security Notifications"
            subtitle="Get notified about security events"
            onPress={() => navigate("/settings/security-notifications")}
            showArrow
          />
        </SettingsSection>

        {/* Privacy Options Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 rounded-lg p-4 mb-6"
        >
          <h4 className="font-medium text-blue-900 mb-2">Privacy Options</h4>
          <div className="text-sm text-blue-800 space-y-2">
            <div>
              <p className="font-medium">Everyone:</p>
              <p>All Hola users can see this information</p>
            </div>
            <div>
              <p className="font-medium">My Contacts:</p>
              <p>Only people in your contacts can see this information</p>
            </div>
            <div>
              <p className="font-medium">Nobody:</p>
              <p>No one can see this information</p>
            </div>
          </div>
        </motion.div>

        {/* Two-Step Verification Info */}
        {settings.twoStepVerification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 mb-1">
                  Two-Step Verification Enabled
                </h4>
                <p className="text-sm text-green-700">
                  Your account is protected with two-step verification. You'll
                  need to enter a PIN when registering your phone number with
                  Hola again.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
