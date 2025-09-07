import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { CallState } from "../../types";
import { Avatar } from "../ui/Avatar";

interface CallScreenProps {
  callState: CallState;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onAnswerCall?: () => void;
  answerLabel?: string;
  declineLabel?: string;
  showAnswer?: boolean;
}

export const CallScreen: React.FC<CallScreenProps> = ({
  callState,
  onEndCall,
  onToggleMute,
  onToggleSpeaker,
  onAnswerCall,
  answerLabel = "Answer",
  declineLabel = "Decline",
  showAnswer = callState.isIncoming,
}) => {
  // State for simulating answered call and duration
  const [answered, setAnswered] = useState(false);
  const [duration, setDuration] = useState(0);
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);
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
    // Only play if not in call (duration 0) and not answered
    if (callState.duration === 0 && !answered) {
      const sound = callState.isIncoming
        ? "/assets/sounds/ringing-tone.mp3"
        : "/assets/sounds/phone-ringing.mp3";
      audioRef.current = new window.Audio(sound);
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
  }, [callState.duration, callState.isIncoming, answered]);

  // Simulate call duration after answering
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (answered) {
      timer = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [answered]);

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

          {callState.isIncoming && !answered ? (
            <motion.p
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-lg text-green-400"
            >
              Incoming call...
            </motion.p>
          ) : (
            <p className="text-lg text-gray-400">
              {answered || callState.duration > 0
                ? formatDuration(answered ? duration : callState.duration)
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
          {/* Only show mute/speaker after answered, or always for outgoing */}
          {(answered || !callState.isIncoming) && (
            <>
              <motion.button
                onClick={() => {
                  setPressedBtn("mute");
                  setTimeout(() => setPressedBtn(null), 200);
                  onToggleMute();
                }}
                className={`p-4 rounded-full transition-colors ${
                  callState.isMuted
                    ? "bg-red-600"
                    : pressedBtn === "mute"
                    ? "bg-gray-500"
                    : "bg-gray-700"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {callState.isMuted ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}
              </motion.button>

              <motion.button
                onClick={() => {
                  setPressedBtn("speaker");
                  setTimeout(() => setPressedBtn(null), 200);
                  onToggleSpeaker();
                }}
                className={`p-4 rounded-full transition-colors ${
                  callState.isSpeakerOn
                    ? "bg-blue-600"
                    : pressedBtn === "speaker"
                    ? "bg-blue-400"
                    : "bg-gray-700"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {callState.isSpeakerOn ? (
                  <Volume2 className="w-6 h-6" />
                ) : (
                  <VolumeX className="w-6 h-6" />
                )}
              </motion.button>
            </>
          )}

          {/* Answer/End Call Buttons for incoming, only if not answered */}
          {showAnswer && !answered ? (
            <div className="flex space-x-6">
              <motion.button
                onClick={() => {
                  setPressedBtn("decline");
                  setTimeout(() => setPressedBtn(null), 200);
                  onEndCall();
                }}
                className={`p-6 rounded-full ${
                  pressedBtn === "decline" ? "bg-red-800" : "bg-red-600"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <PhoneOff className="w-8 h-8" />
                <span className="ml-2 font-semibold text-base hidden sm:inline">
                  {declineLabel}
                </span>
              </motion.button>

              {onAnswerCall && (
                <motion.button
                  onClick={() => {
                    setPressedBtn("answer");
                    setTimeout(() => setPressedBtn(null), 200);
                    setAnswered(true);
                    onAnswerCall();
                  }}
                  className={`p-6 rounded-full animate-pulse ${
                    pressedBtn === "answer" ? "bg-green-800" : "bg-green-600"
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  <Phone className="w-8 h-8" />
                  <span className="ml-2 font-semibold text-base hidden sm:inline">
                    {answerLabel}
                  </span>
                </motion.button>
              )}
            </div>
          ) : null}

          {/* End call button for outgoing or after answered */}
          {!showAnswer && !callState.isIncoming && (
            <motion.button
              onClick={() => {
                setPressedBtn("decline");
                setTimeout(() => setPressedBtn(null), 200);
                onEndCall();
              }}
              className={`p-6 rounded-full ${
                pressedBtn === "decline" ? "bg-red-800" : "bg-red-600"
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <PhoneOff className="w-8 h-8" />
            </motion.button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};
