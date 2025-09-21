import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Moon,
  Shield,
  LogOut,
  ChevronRight,
  Mail,
  Edit,
  Camera,
  MessageCircle,
  Phone,
} from "lucide-react";
import { User as UserType } from "../../types";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";

interface SettingsPageProps {
  user: UserType;
  onUpdateProfile: (updates: Partial<UserType>) => Promise<void>;
  onLogout: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  onUpdateProfile,
  onLogout,
}) => {
  // Guard: If user is null, don't render the page (prevents crash)
  if (!user) return null;

  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.name,
    avatar: user.avatar || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    try {
      await onUpdateProfile(profileData);
      setShowProfileModal(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    navigate("/logout");
  };

  const settingsGroups = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Profile Settings",
          action: () => navigate("/app/settings/profile"),
          showArrow: true,
        },
      ],
    },
    {
      title: "App Preferences",
      items: [
        {
          icon: MessageCircle,
          label: "Chat Settings",
          action: () => navigate("/app/settings/chat"),
          showArrow: true,
        },
        {
          icon: Phone,
          label: "Call Settings",
          action: () => navigate("/app/settings/calls"),
          showArrow: true,
        },
      ],
    },
    {
      title: "Privacy & Security",
      items: [
        {
          icon: Shield,
          label: "Privacy Settings",
          action: () => navigate("/app/settings/privacy"),
          showArrow: true,
        },
      ],
    },
    {
      title: "Account Actions",
      items: [
        {
          icon: LogOut,
          label: "Sign Out",
          action: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-gray-50 pb-20">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 mb-6"
        >
          <div className="flex items-center space-x-4">
            <Avatar
              src={`assets/avatars/${user.avatar}`}
              alt={user.name}
              size="xl"
            />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-black">{user.name}</h2>
              <p className="text-gray-600">{user.phone}</p>
            </div>
            <motion.button
              onClick={() => setShowProfileModal(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <Edit className="w-5 h-5 text-gray-600" />
            </motion.button>
          </div>
        </motion.div>

        {/* Settings Groups */}
        {settingsGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="bg-white mb-6"
          >
            <div className="px-6 py-3 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                {group.title}
              </h3>
            </div>

            {group.items.map((item, itemIndex) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.label}
                  onClick={item.action}
                  className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                    item.danger ? "text-red-600" : "text-black"
                  } ${
                    itemIndex < group.items.length - 1
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>

                  <div className="flex items-center">
                    {item.toggle !== undefined && (
                      <div
                        className={`w-12 h-6 rounded-full transition-colors ${
                          item.toggle ? "bg-black" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                            item.toggle ? "translate-x-6" : "translate-x-0.5"
                          } mt-0.5`}
                        />
                      </div>
                    )}
                    {item.showArrow && (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        ))}
      </div>

      {/* Profile Edit Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Edit Profile"
      >
        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar
                src={profileData.avatar}
                alt={profileData.name}
                size="xl"
              />
              <motion.button
                className="absolute -bottom-2 -right-2 bg-black text-white p-2 rounded-full shadow-lg"
                whileTap={{ scale: 0.95 }}
              >
                <Camera className="w-4 h-4" />
              </motion.button>
            </div>
            <p className="text-sm text-gray-600 mt-2">Tap to change photo</p>
          </div>

          <Input
            label="Name"
            type="text"
            value={profileData.name}
            onChange={(e) =>
              setProfileData({ ...profileData, name: e.target.value })
            }
            icon={<User className="w-5 h-5" />}
          />

          <Input
            label="Email"
            type="text"
            value={profileData.name}
            onChange={(e) =>
              setProfileData({ ...profileData, name: e.target.value })
            }
            icon={<Mail className="w-5 h-5" />}
          />

          <div className="flex space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowProfileModal(false)}
              className="hover:bg-gray-300 border-gray-200"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProfile}
              isLoading={isLoading}
              className="w-full"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
