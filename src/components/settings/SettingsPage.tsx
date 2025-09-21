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

  if (!user) return null;

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
        <div className="px-4 pt-4">
          <ProfileHeader
            user={user}
            onEditProfile={() => navigate("/app/settings/profile")}
          />

          {/* Main Settings Groups */}
          <SettingsSection title="Settings">
            <SettingsRow
              icon={User}
              label="Account Settings"
              subtitle="Profile, phone number, username"
              onPress={() => navigate("/app/settings/profile")}
              showArrow
            />
            <SettingsRow
              icon={MessageCircle}
              label="Chat Settings"
              subtitle="Notifications, read receipts, media"
              onPress={() => navigate("/app/settings/chat")}
              showArrow
            />
            <SettingsRow
              icon={PhoneCall}
              label="Call Settings"
              subtitle="Ringtones, call quality, recording"
              onPress={() => navigate("/app/settings/calls")}
              showArrow
            />
            <SettingsRow
              icon={Shield}
              label="Privacy Settings"
              subtitle="Last seen, blocked contacts, security"
              onPress={() => navigate("/app/settings/privacy")}
              showArrow
            />
            <SettingsRow
              icon={Settings}
              label="App Preferences"
              subtitle="Theme, language, storage"
              onPress={() => navigate("/app/settings/preferences")}
              showArrow
            />
            <SettingsRow
              icon={HelpCircle}
              label="Help & Support"
              subtitle="Help center, report issues, terms"
              onPress={() => navigate("/app/settings/help")}
              showArrow
            />
          </SettingsSection>

          {/* Account Actions */}
          <SettingsSection title="Account">
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
