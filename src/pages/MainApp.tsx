import React, { useState, useEffect, useRef } from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNavigation } from "../components/layout/BottomNavigation";
import { Header } from "../components/layout/Header";
import { RecentCallsList } from "../components/calls/RecentCallsList";
import { FloatingIncomingCallButton } from "../components/calls/FloatingIncomingCallButton";
import { ContactList } from "../components/contacts/ContactList";
import { ContactForm } from "../components/contacts/ContactForm";
import { ConversationList } from "../components/messages/ConversationList";
import { ChatScreen } from "../components/messages/ChatScreen";
import { SettingsPage } from "../components/settings/SettingsPage";
import { CallScreen } from "../components/calls/CallScreen";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { useCall } from "../hooks/useCall";
import { getSocket } from "../socket";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { apiService } from "../services/api";
import { Contact, CallLog, Conversation, Message } from "../types";

export const MainApp: React.FC = () => {
  // State for simulating incoming call
  const [showIncomingCall, setShowIncomingCall] = useState(false);

  // Dummy incoming call data
  const incomingCallData = {
    contact: {
      id: "incoming_1",
      name: "Ada Lovelace",
      phone: "+2348012345678",
      avatar: undefined,
    },
    isIncoming: true,
    isMuted: false,
    isSpeakerOn: false,
    duration: 0,
  };
  const { user, updateUser, logout } = useAuth();
  const {
    callState,
    startCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    answerCall,
  } = useCall();

  // Socket.io setup
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    socketRef.current = socket;
    if (!socket.connected) socket.connect();
    // Register user by phone number
    socket.emit("register", user.phone);

    // Incoming call invite
    socket.on("call-invite", (payload) => {
      // payload: { from, to, channel, ... }
      // Find contact by phone
      const contact = contacts.find((c) => c.phone === payload.from) || {
        id: "temp",
        name: payload.from,
        phone: payload.from,
      };
      startCall(contact, true);
    });

    // Call accept/decline/end events
    socket.on("call-accept", (payload) => {
      // Optionally show UI feedback
    });
    socket.on("call-decline", (payload) => {
      endCall();
    });
    socket.on("call-end", (payload) => {
      endCall();
    });

    return () => {
      socket.off("call-invite");
      socket.off("call-accept");
      socket.off("call-decline");
      socket.off("call-end");
    };
    // eslint-disable-next-line
  }, [user]);

  const navigate = useNavigate();
  const location = useLocation();
  const [contacts, setContacts] = useLocalStorage<Contact[]>(
    "hola_contacts",
    []
  );
  // const [callLogs, setCallLogs] = useLocalStorage<CallLog[]>(
  //   "hola_call_logs",
  //   []
  // );
  const callLogs: CallLog[] = [];
  const [conversations, setConversations] = useLocalStorage<Conversation[]>(
    "hola_conversations",
    []
  );
  const [messages, setMessages] = useLocalStorage<Message[]>(
    "hola_messages",
    []
  );

  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [contactsData, callLogsData, conversationsData] =
          await Promise.all([
            apiService.getContacts(),
            apiService.getCallLogs(),
            apiService.getConversations(),
          ]);

        if (contacts.length === 0) setContacts(contactsData);
        // if (callLogs.length === 0) setCallLogs(callLogsData);
        if (conversations.length === 0) setConversations(conversationsData);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
  }, []);

  const handleCall = (phone: string, name: string) => {
    const contact = contacts.find((c) => c.phone === phone) || {
      id: "temp",
      name,
      phone,
    };
    startCall(contact);
    // Send call-invite via socket
    if (user && socketRef.current) {
      const channel = `call_${user.phone}_${phone}_${Date.now()}`;
      socketRef.current.emit("call-invite", {
        from: user.phone,
        to: phone,
        channel,
      });
    }
  };

  const handleEndCall = () => {
    // Send call-end via socket
    if (user && callState.contact && socketRef.current) {
      socketRef.current.emit("call-end", {
        from: user.phone,
        to: callState.contact.phone,
      });
    }
    endCall();
  };

  const handleAddContact = async (contactData: Omit<Contact, "id">) => {
    setIsLoading(true);
    try {
      const newContact = await apiService.addContact(contactData);
      setContacts((prev) => [
        ...prev,
        { ...newContact, id: `contact_${Date.now()}` },
      ]);
    } catch (error) {
      console.error("Failed to add contact:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateContact = async (contactData: Omit<Contact, "id">) => {
    if (!editingContact) return;

    setIsLoading(true);
    try {
      const updatedContact = await apiService.updateContact(
        editingContact.id,
        contactData
      );
      setContacts((prev) =>
        prev.map((c) =>
          c.id === editingContact.id
            ? { ...updatedContact, id: editingContact.id }
            : c
        )
      );
      setEditingContact(undefined);
    } catch (error) {
      console.error("Failed to update contact:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await apiService.deleteContact(contactId);
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
    } catch (error) {
      console.error("Failed to delete contact:", error);
    }
  };

  const handleToggleFavorite = (contactId: string) => {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId ? { ...c, isFavorite: !c.isFavorite } : c
      )
    );
  };

  const handleSendMessage = async (contactId: string, content: string) => {
    try {
      const newMessage = await apiService.sendMessage(contactId, content);
      const messageWithId = { ...newMessage, id: `msg_${Date.now()}` };
      setMessages((prev) => [...prev, messageWithId]);

      // Update conversation
      const contact = contacts.find((c) => c.id === contactId);
      if (contact) {
        setConversations((prev) => {
          const existingConv = prev.find((c) => c.contactId === contactId);
          if (existingConv) {
            return prev.map((c) =>
              c.contactId === contactId
                ? { ...c, lastMessage: messageWithId, unreadCount: 0 }
                : c
            );
          } else {
            return [
              ...prev,
              {
                id: `conv_${Date.now()}`,
                contactId,
                contactName: contact.name,
                contactPhone: contact.phone,
                contactAvatar: contact.avatar,
                lastMessage: messageWithId,
                unreadCount: 0,
              },
            ];
          }
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleSelectConversation = (contactId: string) => {
    setSelectedContactId(contactId);
    navigate("/app/messages");
  };

  const handleBackFromChat = () => {
    setSelectedContactId(null);
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery)
  );

  const selectedContact = selectedContactId
    ? contacts.find((c) => c.id === selectedContactId)
    : null;
  const contactMessages = selectedContactId
    ? messages.filter((m) => m.contactId === selectedContactId)
    : [];

  const getHeaderTitle = () => {
    if (selectedContactId && selectedContact) {
      return selectedContact.name;
    }
    const path = location.pathname;
    if (path.startsWith("/app/calls")) return "Recent Calls";
    if (path.startsWith("/app/contacts")) return "Contacts";
    if (path.startsWith("/app/messages")) return "Messages";
    if (path.startsWith("/app/settings")) return "Settings";
    return "Hola";
  };

  const getHeaderProps = () => {
    if (selectedContactId) {
      return {
        showBack: true,
        onBack: handleBackFromChat,
      };
    }
    const path = location.pathname;
    if (path.startsWith("/app/contacts")) {
      return {
        showSearch: true,
        showAdd: true,
        onSearch: () => console.log("Search"),
        onAdd: () => setShowContactForm(true),
      };
    }
    if (path.startsWith("/app/messages")) {
      return {
        showSearch: true,
        onSearch: () => console.log("Search messages"),
      };
    }
    return {};
  };

  return (
    <div className="flex flex-col h-screen bg-white pb-16">
      <Header title={getHeaderTitle()} {...getHeaderProps()} />

      <div className="flex-1 overflow-y-auto pb-20 scrollbar-none">
        <AnimatePresence mode="wait">
          {selectedContactId && selectedContact ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <ChatScreen
                contact={selectedContact}
                messages={contactMessages}
                onSendMessage={(content) =>
                  handleSendMessage(selectedContactId, content)
                }
                onBack={handleBackFromChat}
                onCall={(contact) => handleCall(contact.phone, contact.name)}
              />
            </motion.div>
          ) : (
            <Routes>
              <Route
                path="/calls"
                element={
                  <motion.div
                    key="calls"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full"
                  >
                    <RecentCallsList
                      onCall={handleCall}
                      onMessage={handleSelectConversation}
                    />
                  </motion.div>
                }
              />
              <Route
                path="/contacts"
                element={
                  <motion.div
                    key="contacts"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full"
                  >
                    <ContactList
                      contacts={filteredContacts}
                      onCall={(contact) =>
                        handleCall(contact.phone, contact.name)
                      }
                      onMessage={(contact) =>
                        handleSelectConversation(contact.id)
                      }
                      onEdit={(contact) => {
                        setEditingContact(contact);
                        setShowContactForm(true);
                      }}
                      onDelete={handleDeleteContact}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  </motion.div>
                }
              />
              <Route
                path="/messages"
                element={
                  <motion.div
                    key="messages"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full"
                  >
                    <ConversationList
                      conversations={conversations}
                      onSelectConversation={handleSelectConversation}
                    />
                  </motion.div>
                }
              />
              <Route
                path="/settings"
                element={
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="h-full"
                  >
                    <SettingsPage
                      user={user}
                      onUpdateProfile={async (updates) => {
                        updateUser(updates as any);
                      }}
                      onLogout={logout}
                    />
                  </motion.div>
                }
              />
              {/* Redirect /app to /app/calls */}
              <Route path="/" element={<Navigate to="/app/calls" replace />} />
            </Routes>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Incoming Call Button (always visible except in chat) */}
      {!selectedContactId && (
        <FloatingIncomingCallButton onClick={() => setShowIncomingCall(true)} />
      )}
      {!selectedContactId && <BottomNavigation />}

      {/* Contact Form Modal */}
      <ContactForm
        isOpen={showContactForm}
        contact={editingContact}
        onSave={editingContact ? handleUpdateContact : handleAddContact}
        onClose={() => {
          setShowContactForm(false);
          setEditingContact(undefined);
        }}
        isLoading={isLoading}
      />

      {/* Call Screen */}
      {/* Incoming Call Modal */}
      <AnimatePresence>
        {showIncomingCall && (
          <CallScreen
            callState={incomingCallData as any}
            onEndCall={() => setShowIncomingCall(false)}
            onToggleMute={() => {}}
            onToggleSpeaker={() => {}}
            onAnswerCall={() => {}}
            answerLabel="Answer"
            declineLabel="Decline"
            showAnswer={true}
          />
        )}
        {callState.isActive && (
          <CallScreen
            callState={callState}
            onEndCall={handleEndCall}
            onToggleMute={toggleMute}
            onToggleSpeaker={toggleSpeaker}
            onAnswerCall={answerCall}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
