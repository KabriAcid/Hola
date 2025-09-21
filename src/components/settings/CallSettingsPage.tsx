import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell,
  PhoneIncoming,
  PhoneCall,
  Mic,
  Music,
  Volume2,
  Vibrate,
  Clock,
  Shield,
  Headphones,
  Speaker,
  Check,
} from "lucide-react";
import { Header } from "../layout/Header";
import { Modal } from "../ui/Modal";

interface CallSettingsPageProps {}

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

export const CallSettingsPage: React.FC<CallSettingsPageProps> = () => {
  const navigate = useNavigate();
  const [showRingtoneModal, setShowRingtoneModal] = useState(false);
  const [showMicQualityModal, setShowMicQualityModal] = useState(false);
  const [selectedRingtone, setSelectedRingtone] = useState("Default");

  const [settings, setSettings] = useState({
    callNotifications: true,
    callSound: true,
    vibration: true,
    autoAnswerCalls: false,
    autoAnswerDelay: 3,
    callRecording: false,
    callWaiting: true,
    callForwarding: false,
    microphoneQuality: "high",
    speakerMode: "auto",
    noiseReduction: true,
    echoCancellation: true,
  });

  const ringtones = [
    { id: "default", name: "Default", file: "default.mp3" },
    { id: "classic", name: "Classic", file: "classic.mp3" },
    { id: "modern", name: "Modern", file: "modern.mp3" },
    { id: "gentle", name: "Gentle Bell", file: "gentle.mp3" },
    { id: "electronic", name: "Electronic", file: "electronic.mp3" },
    { id: "nature", name: "Nature Sounds", file: "nature.mp3" },
  ];

  const micQualities = [
    { id: "low", name: "Low Quality", description: "Saves bandwidth" },
    {
      id: "medium",
      name: "Medium Quality",
      description: "Balanced quality and data usage",
    },
    { id: "high", name: "High Quality", description: "Best audio quality" },
    {
      id: "hd",
      name: "HD Quality",
      description: "Crystal clear audio (uses more data)",
    },
  ];

  const updateSetting = (key: string, value: boolean | string | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <Header
        title="Voice & Calls"
        showBack
        onBack={() => navigate("/app/settings")}
      />

      <div className="px-4 pt-4 pb-20">
        {/* Call Notifications */}
        <SettingsSection title="Call Notifications">
          <SettingsRow
            icon={Bell}
            label="Call Notifications"
            subtitle="Get notified about incoming calls"
            toggle={settings.callNotifications}
            onToggle={(value) => updateSetting("callNotifications", value)}
          />
          <SettingsRow
            icon={Music}
            label="Ringtone"
            value="Default"
            onPress={() => setShowRingtoneModal(true)}
          />
          <SettingsRow
            icon={Volume2}
            label="Call Sound"
            subtitle="Play ringtone for incoming calls"
            toggle={settings.callSound}
            onToggle={(value) => updateSetting("callSound", value)}
          />
          <SettingsRow
            icon={Vibrate}
            label="Vibration"
            subtitle="Vibrate for incoming calls"
            toggle={settings.vibration}
            onToggle={(value) => updateSetting("vibration", value)}
          />
        </SettingsSection>

        {/* Call Features */}
        <SettingsSection title="Call Features">
          <SettingsRow
            icon={PhoneIncoming}
            label="Auto-answer Calls"
            subtitle="Automatically answer incoming calls"
            toggle={settings.autoAnswerCalls}
            onToggle={(value) => updateSetting("autoAnswerCalls", value)}
          />
          <SettingsRow
            icon={Clock}
            label="Auto-answer Delay"
            value="3 seconds"
            onPress={() => console.log("Select auto-answer delay")}
          />
          <SettingsRow
            icon={PhoneCall}
            label="Call Waiting"
            subtitle="Get notified of incoming calls during a call"
            toggle={settings.callWaiting}
            onToggle={(value) => updateSetting("callWaiting", value)}
          />
          <SettingsRow
            icon={PhoneCall}
            label="Call Forwarding"
            subtitle="Forward calls to another number"
            toggle={settings.callForwarding}
            onToggle={(value) => updateSetting("callForwarding", value)}
          />
        </SettingsSection>

        {/* Call Recording */}
        <SettingsSection title="Call Recording">
          <SettingsRow
            icon={PhoneCall}
            label="Call Recording"
            subtitle="Record calls (requires permission)"
            toggle={settings.callRecording}
            onToggle={(value) => updateSetting("callRecording", value)}
          />
        </SettingsSection>

        {/* Audio Quality */}
        <SettingsSection title="Audio Quality">
          <SettingsRow
            icon={Mic}
            label="Microphone Quality"
            value="High Quality"
            onPress={() => setShowMicQualityModal(true)}
          />
          <SettingsRow
            icon={Speaker}
            label="Speaker Mode"
            value="Auto"
            onPress={() => console.log("Select speaker mode")}
          />
          <SettingsRow
            icon={Headphones}
            label="Noise Reduction"
            subtitle="Reduce background noise during calls"
            toggle={settings.noiseReduction}
            onToggle={(value) => updateSetting("noiseReduction", value)}
          />
          <SettingsRow
            icon={Volume2}
            label="Echo Cancellation"
            subtitle="Prevent echo during calls"
            toggle={settings.echoCancellation}
            onToggle={(value) => updateSetting("echoCancellation", value)}
          />
        </SettingsSection>

        {/* Call Recording Warning */}
        {settings.callRecording && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">
                  Call Recording Notice
                </h4>
                <p className="text-sm text-yellow-700">
                  Recording calls may require consent from all parties. Please
                  check your local laws and regulations before recording calls.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 rounded-lg p-4"
        >
          <h4 className="font-medium text-blue-900 mb-2">Call Quality Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use a stable internet connection for better call quality</li>
            <li>• Enable noise reduction in noisy environments</li>
            <li>• High-quality microphone settings use more data</li>
            <li>• Auto-answer is useful for hands-free scenarios</li>
          </ul>
        </motion.div>
      </div>

      {/* Ringtone Selection Modal */}
      <Modal
        isOpen={showRingtoneModal}
        onClose={() => setShowRingtoneModal(false)}
        title="Choose Ringtone"
      >
        <div className="space-y-2">
          {ringtones.map((ringtone) => (
            <motion.button
              key={ringtone.id}
              onClick={() => {
                setSelectedRingtone(ringtone.name);
                setShowRingtoneModal(false);
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-3">
                <Music className="w-5 h-5 text-gray-600" />
                <span className="font-medium">{ringtone.name}</span>
              </div>
              {selectedRingtone === ringtone.name && (
                <div className="w-2 h-2 bg-black rounded-full" />
              )}
            </motion.button>
          ))}
        </div>
      </Modal>

      {/* Microphone Quality Modal */}
      <Modal
        isOpen={showMicQualityModal}
        onClose={() => setShowMicQualityModal(false)}
        title="Microphone Quality"
      >
        <div className="space-y-2">
          {micQualities.map((quality) => (
            <motion.button
              key={quality.id}
              onClick={() => {
                updateSetting("microphoneQuality", quality.id);
                setShowMicQualityModal(false);
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center space-x-3">
                <Mic className="w-5 h-5 text-gray-600" />
                <div className="text-left">
                  <div className="font-medium">{quality.name}</div>
                  <div className="text-sm text-gray-500">
                    {quality.description}
                  </div>
                </div>
              </div>
              {settings.microphoneQuality === quality.id && (
                <div className="w-2 h-2 bg-black rounded-full" />
              )}
            </motion.button>
          ))}
        </div>
      </Modal>
    </div>
  );
};
