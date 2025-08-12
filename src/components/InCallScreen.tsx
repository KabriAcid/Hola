import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Video, 
  VideoOff,
  MessageSquare,
  UserPlus,
  MoreHorizontal
} from 'lucide-react';
import { Contact, CallState } from '../types';

interface InCallScreenProps {
  callState: CallState;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onToggleVideo: () => void;
}

export const InCallScreen: React.FC<InCallScreenProps> = ({
  callState,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  onToggleVideo,
}) => {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const contact = callState.contact;
  if (!contact) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 min-h-screen text-white relative overflow-hidden"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-500 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-10 w-40 h-40 bg-accent-blue-500 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <div className="pt-12 pb-8 text-center">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white/60 text-sm mb-2"
          >
            {callState.isVideoCall ? 'Video Call' : 'Voice Call'}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/80 text-lg font-medium"
          >
            {formatDuration(duration)}
          </motion.p>
        </div>

        {/* Contact info */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-12"
          >
            <div className="relative mb-6">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold mx-auto shadow-2xl ${
                  contact.initials === '+' ? 'bg-accent-blue-100 text-accent-blue-600' : 'bg-white text-gray-700'
                }`}
              >
                {contact.initials}
              </motion.div>
              
              {/* Pulse animation for active call */}
              <motion.div
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 border-4 border-primary-400 rounded-full"
              />
            </div>
            
            <h2 className="text-2xl font-semibold mb-2">
              {contact.name || contact.phone}
            </h2>
            {contact.label && (
              <p className="text-white/60">{contact.label}</p>
            )}
          </motion.div>
        </div>

        {/* Call controls */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="px-8 pb-12"
        >
          {/* Secondary controls */}
          <div className="flex justify-center space-x-6 mb-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <MessageSquare className="w-6 h-6" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <UserPlus className="w-6 h-6" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <MoreHorizontal className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Primary controls */}
          <div className="flex justify-center items-center space-x-8">
            {/* Mute button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggleMute}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                callState.isMuted 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
              }`}
            >
              {callState.isMuted ? (
                <MicOff className="w-7 h-7" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </motion.button>

            {/* End call button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onEndCall}
              className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-2xl transition-colors"
            >
              <PhoneOff className="w-8 h-8" />
            </motion.button>

            {/* Speaker button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onToggleSpeaker}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                callState.isSpeakerOn 
                  ? 'bg-primary-500 hover:bg-primary-600' 
                  : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
              }`}
            >
              {callState.isSpeakerOn ? (
                <Volume2 className="w-7 h-7" />
              ) : (
                <VolumeX className="w-7 h-7" />
              )}
            </motion.button>
          </div>

          {/* Video toggle (if video call) */}
          {callState.isVideoCall && (
            <div className="flex justify-center mt-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleVideo}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                  callState.isVideoCall 
                    ? 'bg-accent-blue-500 hover:bg-accent-blue-600' 
                    : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                }`}
              >
                {callState.isVideoCall ? (
                  <Video className="w-7 h-7" />
                ) : (
                  <VideoOff className="w-7 h-7" />
                )}
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};