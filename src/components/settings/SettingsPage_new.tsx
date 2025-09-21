import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Phone,
  MessageCircle,
  PhoneCall,
  Shield,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Edit3,
  Camera,
  Bell,
  Eye,
  Keyboard,
  Download,
  Archive,
  PhoneIncoming,
  Mic,
  Music,
  UserX,
  EyeOff,
  Lock,
  Palette,
  Globe,
  HardDrive,
  BarChart3,
  MessageSquare,
  FileText,
  Info,
  UserPlus,
  Trash2,
} from "lucide-react";
import { User as UserType } from "../../types";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Header } from "../layout/Header";

interface SettingsPageProps {
  user: UserType;
  onUpdateProfile: (updates: Partial<UserType>) => Promise<void>;
  onLogout: () => void;
}

interface SettingsRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  toggle?: boolean;
  onToggle?: (value: boolean) => void;
  showArrow?: boolean;
  danger?: boolean;
  value?: string;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon: Icon,
  label,
  subtitle,
  onPress,
  toggle,
  onToggle,
  showArrow = false,
  danger = false,
  value,
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
      className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left ${
        danger ? "text-red-600" : "text-black"
      }`}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        <div
          className={`p-2 rounded-full ${danger ? "bg-red-50" : "bg-gray-100"}`}
        >
          <Icon
            className={`w-5 h-5 ${danger ? "text-red-600" : "text-gray-700"}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className={`font-medium ${danger ? "text-red-600" : "text-black"}`}
          >
            {label}
          </p>
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

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  children,
}) => (
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

const ProfileHeader: React.FC<{
  user: UserType;
  onEditProfile: () => void;
}> = ({ user, onEditProfile }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 mb-6 rounded-lg shadow-sm"
  >
    <div className="flex items-center space-x-4">
      <div className="relative">
        <Avatar
          src={user.avatar ? `assets/avatars/${user.avatar}` : undefined}
          alt={user.name}
          size="xl"
          isOnline={user.status === "online"}
        />
        <motion.button
          onClick={onEditProfile}
          className="absolute -bottom-1 -right-1 bg-black text-white p-1.5 rounded-full shadow-lg"
          whileTap={{ scale: 0.95 }}
        >
          <Camera className="w-3 h-3" />
        </motion.button>
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-semibold text-black truncate">
          {user.name}
        </h2>
        <p className="text-gray-600">{user.phone}</p>
        <div className="flex items-center space-x-2 mt-1">
          <div
            className={`w-2 h-2 rounded-full ${
              user.status === "online"
                ? "bg-green-500"
                : user.status === "away"
                ? "bg-yellow-500"
                : user.status === "busy"
                ? "bg-red-500"
                : "bg-gray-400"
            }`}
          />
          <span className="text-sm text-gray-500 capitalize">
            {user.status || "offline"}
          </span>
        </div>
      </div>
      <Button variant="secondary" onClick={onEditProfile} className="px-4 py-2">
        <Edit3 className="w-4 h-4 mr-2" />
        Edit
      </Button>
    </div>
    {user.bio && <p className="text-gray-600 mt-3 text-sm">{user.bio}</p>}
  </motion.div>
);

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  onUpdateProfile,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Settings state - in a real app, these would come from a settings context/store
  const [settings, setSettings] = useState({
    messageNotifications: true,
    readReceipts: true,
    typingIndicators: true,
    autoDownloadMedia: false,
    chatBackup: true,
    callNotifications: true,
    autoAnswerCalls: false,
    callRecording: false,
    darkMode: false,
    lastSeenPrivacy: "everyone",
    profilePhotoPrivacy: "contacts",
    statusPrivacy: "contacts",
    twoStepVerification: false,
  });

  if (!user) return null;

  const updateSetting = (key: string, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  const handleDeleteAccount = () => {
    // In a real app, this would show a multi-step confirmation process
    setShowDeleteModal(false);
    console.log("Delete account initiated");
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-gray-50 pb-20">
        <Header title="Settings" />

        <div className="px-4 pt-4">
          <ProfileHeader
            user={user}
            onEditProfile={() => navigate("/settings/profile")}
          />

          {/* Account Settings */}
          <SettingsSection title="Account">
            <SettingsRow
              icon={User}
              label="Edit Profile"
              subtitle="Name, photo, bio, email"
              onPress={() => navigate("/app/profile-settings")}
              showArrow
            />
            <SettingsRow
              icon={Phone}
              label="Phone Number"
              subtitle={user.phone}
              onPress={() => navigate("/settings/phone")}
              showArrow
            />
            <SettingsRow
              icon={User}
              label="Username"
              subtitle={user.username || "Not set"}
              onPress={() => navigate("/settings/username")}
              showArrow
            />
            <SettingsRow
              icon={Shield}
              label="Privacy Settings"
              onPress={() => navigate("/app/privacy-settings")}
              showArrow
            />
          </SettingsSection>

          {/* Chat & Messaging */}
          <SettingsSection title="Chat & Messaging">
            <SettingsRow
              icon={Bell}
              label="Message Notifications"
              toggle={settings.messageNotifications}
              onToggle={(value) => updateSetting("messageNotifications", value)}
            />
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
              subtitle="Show when you're typing"
              toggle={settings.typingIndicators}
              onToggle={(value) => updateSetting("typingIndicators", value)}
            />
            <SettingsRow
              icon={Download}
              label="Auto-download Media"
              subtitle="Automatically download photos and videos"
              toggle={settings.autoDownloadMedia}
              onToggle={(value) => updateSetting("autoDownloadMedia", value)}
            />
            <SettingsRow
              icon={Archive}
              label="Chat Backup"
              subtitle="Back up your messages to cloud storage"
              toggle={settings.chatBackup}
              onToggle={(value) => updateSetting("chatBackup", value)}
            />
          </SettingsSection>

          {/* Voice & Calls */}
          <SettingsSection title="Voice & Calls">
            <SettingsRow
              icon={Bell}
              label="Call Notifications"
              toggle={settings.callNotifications}
              onToggle={(value) => updateSetting("callNotifications", value)}
            />
            <SettingsRow
              icon={PhoneIncoming}
              label="Auto-answer Calls"
              subtitle="Automatically answer incoming calls"
              toggle={settings.autoAnswerCalls}
              onToggle={(value) => updateSetting("autoAnswerCalls", value)}
            />
            <SettingsRow
              icon={PhoneCall}
              label="Call Recording"
              subtitle="Record calls (requires permission)"
              toggle={settings.callRecording}
              onToggle={(value) => updateSetting("callRecording", value)}
            />
            <SettingsRow
              icon={Music}
              label="Ringtone Selection"
              value="Default"
              onPress={() => navigate("/app/call-settings")}
              showArrow
            />
            <SettingsRow
              icon={Mic}
              label="Microphone Quality"
              value="High Quality"
              onPress={() => navigate("/app/call-settings")}
              showArrow
            />
          </SettingsSection>

          {/* Privacy & Security */}
          <SettingsSection title="Privacy & Security">
            <SettingsRow
              icon={UserX}
              label="Blocked Contacts"
              subtitle="Manage blocked users"
              onPress={() => navigate("/settings/blocked")}
              showArrow
            />
            <SettingsRow
              icon={EyeOff}
              label="Last Seen Privacy"
              value="Everyone"
              onPress={() => navigate("/settings/last-seen")}
              showArrow
            />
            <SettingsRow
              icon={User}
              label="Profile Photo Privacy"
              value="My Contacts"
              onPress={() => navigate("/settings/profile-privacy")}
              showArrow
            />
            <SettingsRow
              icon={MessageCircle}
              label="Status Privacy"
              value="My Contacts"
              onPress={() => navigate("/settings/status-privacy")}
              showArrow
            />
            <SettingsRow
              icon={Lock}
              label="Two-Step Verification"
              subtitle="Add extra security to your account"
              toggle={settings.twoStepVerification}
              onToggle={(value) => updateSetting("twoStepVerification", value)}
            />
          </SettingsSection>

          {/* App Preferences */}
          <SettingsSection title="App Preferences">
            <SettingsRow
              icon={Palette}
              label="Theme"
              value="Light"
              onPress={() => navigate("/settings/theme")}
              showArrow
            />
            <SettingsRow
              icon={Globe}
              label="Language"
              value="English"
              onPress={() => navigate("/settings/language")}
              showArrow
            />
            <SettingsRow
              icon={HardDrive}
              label="Storage Management"
              subtitle="Manage app storage and cache"
              onPress={() => navigate("/settings/storage")}
              showArrow
            />
            <SettingsRow
              icon={BarChart3}
              label="Data Usage"
              subtitle="Monitor your data consumption"
              onPress={() => navigate("/settings/data-usage")}
              showArrow
            />
          </SettingsSection>

          {/* Support & Info */}
          <SettingsSection title="Support & Info">
            <SettingsRow
              icon={HelpCircle}
              label="Help Center"
              onPress={() => navigate("/settings/help")}
              showArrow
            />
            <SettingsRow
              icon={MessageSquare}
              label="Report a Problem"
              onPress={() => navigate("/settings/report")}
              showArrow
            />
            <SettingsRow
              icon={FileText}
              label="Terms of Service"
              onPress={() => navigate("/settings/terms")}
              showArrow
            />
            <SettingsRow
              icon={Shield}
              label="Privacy Policy"
              onPress={() => navigate("/settings/privacy-policy")}
              showArrow
            />
            <SettingsRow icon={Info} label="App Version" value="v2.1.0" />
          </SettingsSection>

          {/* Account Actions */}
          <SettingsSection title="Account Actions">
            <SettingsRow
              icon={UserPlus}
              label="Switch Account"
              subtitle="Switch to another account"
              onPress={() => navigate("/settings/switch-account")}
              showArrow
            />
            <SettingsRow
              icon={LogOut}
              label="Sign Out"
              onPress={() => setShowLogoutModal(true)}
              danger
            />
            <SettingsRow
              icon={Trash2}
              label="Delete Account"
              subtitle="Permanently delete your account"
              onPress={() => setShowDeleteModal(true)}
              danger
            />
          </SettingsSection>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Sign Out"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to sign out of your account?
          </p>
          <div className="flex space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowLogoutModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogout}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">Warning</h4>
            <p className="text-red-700 text-sm">
              This action cannot be undone. All your messages, contacts, and
              account data will be permanently deleted.
            </p>
          </div>
          <p className="text-gray-600">
            Are you absolutely sure you want to delete your account? This will:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 ml-4">
            <li>• Delete all your messages and media</li>
            <li>• Remove you from all group chats</li>
            <li>• Delete your profile and contact information</li>
            <li>• Cancel any active subscriptions</li>
          </ul>
          <div className="flex space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
