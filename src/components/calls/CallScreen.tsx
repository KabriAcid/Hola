import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { CallState } from "../../types";
import { Avatar } from "../ui/Avatar";

interface CallScreenProps {
  callState: CallState;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onAnswerCall: () => void;
}

export const CallScreen: React.FC<CallScreenProps> = ({
  callState,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  onAnswerCall,
}) => {
  // Ref for audio element
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Play ringing/beep sound on mount if not in call
  useEffect(() => {
    // Only play if not in call (duration 0)
    if (callState.duration === 0) {
      audioRef.current = new window.Audio("/assets/sounds/phone-ringing.mp3");
      audioRef.current.loop = true;
      audioRef.current.play().catch(() => {});
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, [callState.duration]);

  if (!callState.contact) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black text-white z-50 flex flex-col"
    >
      {/* Background with blur effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black" />

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-8">
        {/* Contact Info */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="mb-6">
            <Avatar
              src={callState.contact.avatar}
              alt={callState.contact.name}
              size="xl"
              className="mx-auto animate-pulse-ring"
            />
          </div>

          <h1 className="text-2xl font-semibold mb-2">
            {callState.contact.name}
          </h1>
          <p className="text-gray-300 mb-2">{callState.contact.phone}</p>

          {callState.isIncoming ? (
            <motion.p
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-lg text-green-400"
            >
              Incoming call...
            </motion.p>
          ) : (
            <p className="text-lg text-gray-400">
              {callState.duration > 0
                ? formatDuration(callState.duration)
                : "Connecting..."}
            </p>
          )}
        </motion.div>

        {/* Call Controls */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center space-x-6"
        >
          {/* Mute Button */}
          <motion.button
            onClick={onToggleMute}
            className={`p-4 rounded-full transition-colors ${
              callState.isMuted ? "bg-red-600" : "bg-gray-700"
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {callState.isMuted ? (
              <MicOff className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </motion.button>

          {/* Answer/End Call Button */}
          {callState.isIncoming ? (
            <div className="flex space-x-6">
              <motion.button
                onClick={onEndCall}
                className="p-6 bg-red-600 rounded-full"
                whileTap={{ scale: 0.95 }}
              >
                <PhoneOff className="w-8 h-8" />
              </motion.button>

              <motion.button
                onClick={onAnswerCall}
                className="p-6 bg-green-600 rounded-full animate-pulse"
                whileTap={{ scale: 0.95 }}
              >
                <Phone className="w-8 h-8" />
              </motion.button>
            </div>
          ) : (
            <motion.button
              onClick={onEndCall}
              className="p-6 bg-red-600 rounded-full"
              whileTap={{ scale: 0.95 }}
            >
              <PhoneOff className="w-8 h-8" />
            </motion.button>
          )}

          {/* Speaker Button */}
          <motion.button
            onClick={onToggleSpeaker}
            className={`p-4 rounded-full transition-colors ${
              callState.isSpeakerOn ? "bg-blue-600" : "bg-gray-700"
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {callState.isSpeakerOn ? (
              <Volume2 className="w-6 h-6" />
            ) : (
              <VolumeX className="w-6 h-6" />
            )}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};
