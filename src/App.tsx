import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SplashScreen } from "./components/SplashScreen";
import { AuthScreen } from "./components/AuthScreen";
import { RegisterScreen } from "./components/RegisterScreen";
import { LoginScreen } from "./components/LoginScreen";
import { CallHistory } from "./components/CallHistory";
import { Contacts } from "./components/Contacts";
import { InCallScreen } from "./components/InCallScreen";
import { BottomNav } from "./components/BottomNav";
import { Modal } from "./components/Modal";
import { Settings } from "./components/Settings";

import { mockContacts, allContacts } from "./data/mockData";
import {
  Contact,
  TabType,
  AuthScreen as AuthScreenType,
  RegisterMethod,
  CallState,
} from "./types";

function App() {
  const [currentScreen, setCurrentScreen] = useState<AuthScreenType>("splash");
  const [activeTab, setActiveTab] = useState<TabType>("recents");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    contact: null,
    duration: 0,
    isMuted: false,
    isSpeakerOn: false,
    isVideoCall: false,
  });

  const handleSplashComplete = () => {
    setCurrentScreen("auth");
  };

  const handleRegister = (method: RegisterMethod, data: string) => {
    console.log("Registration:", method, data);
    setCurrentScreen("app");
  };

  const handleLogin = (phone: string, password: string) => {
    console.log("Login:", phone, password);
    setCurrentScreen("app");
  };

  const handleContactClick = (contact: Contact) => {
    if (callState.isActive) return;
    setSelectedContact(contact);
  };

  const handleStartCall = (contact: Contact, isVideo = false) => {
    setCallState({
      isActive: true,
      contact,
      duration: 0,
      isMuted: false,
      isSpeakerOn: false,
      isVideoCall: isVideo,
    });
    setSelectedContact(null);
  };

  const handleEndCall = () => {
    setCallState({
      isActive: false,
      contact: null,
      duration: 0,
      isMuted: false,
      isSpeakerOn: false,
      isVideoCall: false,
    });
  };

  const handleToggleMute = () => {
    setCallState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const handleToggleSpeaker = () => {
    setCallState((prev) => ({ ...prev, isSpeakerOn: !prev.isSpeakerOn }));
  };

  const handleToggleVideo = () => {
    setCallState((prev) => ({ ...prev, isVideoCall: !prev.isVideoCall }));
  };

  const renderContent = () => {
    switch (activeTab) {
      case "recents":
        return (
          <CallHistory
            contacts={mockContacts}
            onContactClick={handleContactClick}
          />
        );
      case "contacts":
        return (
          <Contacts
            contacts={allContacts}
            onContactClick={handleContactClick}
          />
        );
      case "settings":
        return <Settings />;
      default:
        return null;
    }
  };

  // Show in-call screen if call is active
  if (callState.isActive) {
    return (
      <InCallScreen
        callState={callState}
        onEndCall={handleEndCall}
        onToggleMute={handleToggleMute}
        onToggleSpeaker={handleToggleSpeaker}
        onToggleVideo={handleToggleVideo}
      />
    );
  }

  // Show splash screen
  if (currentScreen === "splash") {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (currentScreen === "register") {
    return (
      <div className="font-dm-sans">
        <RegisterScreen
          onRegister={handleRegister}
          onBack={() => setCurrentScreen("splash")}
        />
      </div>
    );
  }

  if (currentScreen === "login") {
    return (
      <div className="font-dm-sans">
        <LoginScreen
          onBack={() => setCurrentScreen("splash")}
          onLogin={handleLogin}
        />
      </div>
    );
  }

  if (currentScreen === "auth") {
    return (
      <div className="font-dm-sans">
        <AuthScreen
          onRegister={() => setCurrentScreen("register")}
          onLogin={() => setCurrentScreen("login")}
        />
      </div>
    );
  }

  return (
    <div className="font-dm-sans bg-gray-50 min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden h-[800px] flex flex-col"
      >
        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
      </motion.div>

      {/* Contact Details Modal */}
      <Modal
        isOpen={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        title="Contact Details"
      >
        {selectedContact && (
          <div className="text-center">
            <div
              className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-xl font-medium ${
                selectedContact.initials === "+"
                  ? "bg-accent-blue-100 text-accent-blue-600"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {selectedContact.initials}
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {selectedContact.name || selectedContact.phone}
            </h3>
            {selectedContact.label && (
              <p className="text-gray-500 mb-4">{selectedContact.label}</p>
            )}
            <p className="text-sm text-gray-500 mb-6">
              Last call: {selectedContact.lastCallTime}
            </p>

            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleStartCall(selectedContact, false)}
                className="flex-1 bg-primary-500 text-white py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors"
              >
                Call
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleStartCall(selectedContact, true)}
                className="flex-1 bg-accent-blue-500 text-white py-3 rounded-xl font-medium hover:bg-accent-blue-600 transition-colors"
              >
                Video
              </motion.button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default App;
