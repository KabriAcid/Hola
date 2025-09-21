import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  MessageSquare,
  Camera,
  Upload,
  X,
  Check,
} from "lucide-react";
import { User as UserType } from "../../types";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Header } from "../layout/Header";

interface ProfileSettingsPageProps {
  user: UserType;
  onUpdateProfile: (updates: Partial<UserType>) => Promise<void>;
}

export const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({
  user,
  onUpdateProfile,
}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user.name || "",
    email: user.email || "",
    bio: user.bio || "",
    username: user.username || "",
    avatar: user.avatar || "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!profileData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (profileData.email && !/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (profileData.username && profileData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (profileData.bio && profileData.bio.length > 150) {
      newErrors.bio = "Bio must be less than 150 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ avatar: "Image must be less than 5MB" });
        return;
      }

      // Check file type
      if (!file.type.startsWith("image/")) {
        setErrors({ avatar: "Please select an image file" });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setErrors({ ...errors, avatar: "" });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // In a real app, you would upload the image first if selectedFile exists
      let avatarUrl = profileData.avatar;

      if (selectedFile) {
        // Simulate image upload
        console.log(
          `Uploading image: ${selectedFile.name}, Size: ${(
            selectedFile.size /
            1024 /
            1024
          ).toFixed(1)} MB`
        );
        // avatarUrl = await uploadImage(selectedFile);
      }

      await onUpdateProfile({
        ...profileData,
        avatar: avatarUrl,
      });

      navigate("/app/settings");
    } catch (error) {
      console.error("Failed to update profile:", error);
      setErrors({ general: "Failed to update profile. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  const getImageSize = () => {
    if (selectedFile) {
      return `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`;
    }
    return "";
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <Header
        title="Edit Profile"
        showBack
        onBack={() => navigate("/app/settings")}
      />

      <div className="px-4 pt-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6 space-y-6"
        >
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar
                src={
                  previewUrl ||
                  (profileData.avatar
                    ? `assets/avatars/${profileData.avatar}`
                    : undefined)
                }
                alt={profileData.name}
                size="xl"
              />
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-black text-white p-2 rounded-full shadow-lg"
                whileTap={{ scale: 0.95 }}
              >
                <Camera className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">Tap to change photo</p>
              {selectedFile && (
                <p className="text-xs text-gray-500 mt-1">
                  {selectedFile.name} • {getImageSize()}
                </p>
              )}
              {errors.avatar && (
                <p className="text-xs text-red-600 mt-1">{errors.avatar}</p>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFile && (
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl("");
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="px-3 py-1 text-sm"
                >
                  <X className="w-3 h-3 mr-1" />
                  Remove
                </Button>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <Input
              label="Name"
              type="text"
              value={profileData.name}
              onChange={(e) =>
                setProfileData({ ...profileData, name: e.target.value })
              }
              error={errors.name}
              icon={<User className="w-5 h-5" />}
              placeholder="Enter your name"
            />

            <Input
              label="Username"
              type="text"
              value={profileData.username}
              onChange={(e) =>
                setProfileData({ ...profileData, username: e.target.value })
              }
              error={errors.username}
              icon={<User className="w-5 h-5" />}
              placeholder="Choose a username"
            />

            <Input
              label="Email"
              type="email"
              value={profileData.email}
              onChange={(e) =>
                setProfileData({ ...profileData, email: e.target.value })
              }
              error={errors.email}
              icon={<Mail className="w-5 h-5" />}
              placeholder="Enter your email"
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={profileData.bio}
                  onChange={(e) =>
                    setProfileData({ ...profileData, bio: e.target.value })
                  }
                  placeholder="Tell people about yourself..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                  rows={3}
                  maxLength={150}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{errors.bio}</span>
                <span>{profileData.bio.length}/150</span>
              </div>
            </div>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => navigate("/app/settings")}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              isLoading={isLoading}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 rounded-lg p-4 mt-4"
        >
          <h4 className="font-medium text-blue-900 mb-2">Profile Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use a clear, recent photo for your profile picture</li>
            <li>• Keep your bio concise and friendly</li>
            <li>• Your username should be unique and easy to remember</li>
            <li>• Email is optional but helps with account recovery</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
};
