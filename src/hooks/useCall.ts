import { useState, useEffect, useCallback } from 'react';
import { CallState, Contact } from '../types';

export const useCall = () => {
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    contact: null,
    duration: 0,
    isMuted: false,
    isSpeakerOn: false,
    isIncoming: false,
  });

  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const startCall = useCallback((contact: Contact, isIncoming = false) => {
    setCallState({
      isActive: true,
      contact,
      duration: 0,
      isMuted: false,
      isSpeakerOn: false,
      isIncoming,
    });

    // Start duration timer
    const id = setInterval(() => {
      setCallState(prev => ({
        ...prev,
        duration: prev.duration + 1,
      }));
    }, 1000);
    setIntervalId(id);
  }, []);

  const endCall = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    
    setCallState({
      isActive: false,
      contact: null,
      duration: 0,
      isMuted: false,
      isSpeakerOn: false,
      isIncoming: false,
    });
  }, [intervalId]);

  const toggleMute = useCallback(() => {
    setCallState(prev => ({
      ...prev,
      isMuted: !prev.isMuted,
    }));
  }, []);

  const toggleSpeaker = useCallback(() => {
    setCallState(prev => ({
      ...prev,
      isSpeakerOn: !prev.isSpeakerOn,
    }));
  }, []);

  const answerCall = useCallback(() => {
    setCallState(prev => ({
      ...prev,
      isIncoming: false,
    }));
  }, []);

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return {
    callState,
    startCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    answerCall,
  };
};