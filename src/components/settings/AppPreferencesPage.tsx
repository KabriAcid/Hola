import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Palette,
  Globe,
  HardDrive,
  BarChart3,
  Moon,
  Sun,
  Smartphone,
  Monitor,
  Check,
  ChevronRight,
} from "lucide-react";
import { Header } from "../layout/Header";
import { Modal } from "../ui/Modal";

interface AppPreferencesPageProps {}

interface SettingsRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  onToggle?: (value: boolean) => void;
  showArrow?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  icon: Icon,
  label,
  subtitle,
  value,
  onPress,
  toggle,
  onToggle,
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
      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
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

export const AppPreferencesPage: React.FC<AppPreferencesPageProps> = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("Light");
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  const themes = [
    { id: "light", name: "Light", icon: Sun },
    { id: "dark", name: "Dark", icon: Moon },
    { id: "system", name: "System", icon: Monitor },
  ];

  const languages = [
    { id: "en", name: "English", flag: "🇺🇸" },
    { id: "es", name: "Español", flag: "🇪🇸" },
    { id: "fr", name: "Français", flag: "🇫🇷" },
    { id: "de", name: "Deutsch", flag: "🇩🇪" },
    { id: "pt", name: "Português", flag: "🇵🇹" },
    { id: "it", name: "Italiano", flag: "🇮🇹" },
  ];

  const handleThemeSelect = (theme: string) => {
    setSelectedTheme(theme);
    setShowThemeModal(false);
    // Here you would apply the theme
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
    setShowLanguageModal(false);
    // Here you would apply the language
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <Header
          title="App Preferences"
          showBack
          onBack={() => navigate("/app/settings")}
        />

        <div className="px-4 pt-4 pb-20">
          {/* Appearance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm mb-6"
          >
            <div className="px-6 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Appearance
              </h3>
            </div>
            <div>
              <SettingsRow
                icon={Palette}
                label="Theme"
                value={selectedTheme}
                onPress={() => setShowThemeModal(true)}
                showArrow
              />
              <SettingsRow
                icon={Moon}
                label="Dark Mode"
                subtitle="Use dark theme for better night viewing"
                toggle={darkMode}
                onToggle={setDarkMode}
              />
            </div>
          </motion.div>

          {/* Language & Region */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm mb-6"
          >
            <div className="px-6 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Language & Region
              </h3>
            </div>
            <div>
              <SettingsRow
                icon={Globe}
                label="Language"
                value={selectedLanguage}
                onPress={() => setShowLanguageModal(true)}
                showArrow
              />
            </div>
          </motion.div>

          {/* Storage & Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm mb-6"
          >
            <div className="px-6 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Storage & Data
              </h3>
            </div>
            <div>
              <SettingsRow
                icon={HardDrive}
                label="Storage Management"
                subtitle="Manage app storage and cache"
                value="2.1 GB used"
                onPress={() => setShowStorageModal(true)}
                showArrow
              />
              <SettingsRow
                icon={BarChart3}
                label="Data Usage"
                subtitle="Monitor your data consumption"
                value="156 MB this month"
                showArrow
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Theme Selection Modal */}
      <Modal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        title="Choose Theme"
      >
        <div className="space-y-2">
          {themes.map((theme) => (
            <motion.button
              key={theme.id}
              onClick={() => handleThemeSelect(theme.name)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-3">
                <theme.icon className="w-5 h-5 text-gray-600" />
                <span className="font-medium">{theme.name}</span>
              </div>
              {selectedTheme === theme.name && (
                <Check className="w-5 h-5 text-green-600" />
              )}
            </motion.button>
          ))}
        </div>
      </Modal>

      {/* Language Selection Modal */}
      <Modal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        title="Choose Language"
      >
        <div className="space-y-2">
          {languages.map((language) => (
            <motion.button
              key={language.id}
              onClick={() => handleLanguageSelect(language.name)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
              </div>
              {selectedLanguage === language.name && (
                <Check className="w-5 h-5 text-green-600" />
              )}
            </motion.button>
          ))}
        </div>
      </Modal>

      {/* Storage Management Modal */}
      <Modal
        isOpen={showStorageModal}
        onClose={() => setShowStorageModal(false)}
        title="Storage Management"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Total Storage Used</span>
              <span className="font-semibold">2.1 GB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: "65%" }}
              ></div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700">Messages & Media</span>
              <span className="text-sm text-gray-500">1.8 GB</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700">App Cache</span>
              <span className="text-sm text-gray-500">200 MB</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700">Call Recordings</span>
              <span className="text-sm text-gray-500">100 MB</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <motion.button
              className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              Clear Cache
            </motion.button>
          </div>
        </div>
      </Modal>
    </>
  );
};
