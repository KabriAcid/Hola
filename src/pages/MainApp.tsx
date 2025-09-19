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
import { apiService } from "../services/api";
import { Contact, CallLog, Conversation, Message } from "../types";
import { useAgoraAudio } from "../hooks/useAgoraAudio";

export const MainApp: React.FC = () => {
  // Track if call is answered (for CallScreen)
  const [isCallAnswered, setIsCallAnswered] = useState(false);
  // Store channel for Agora (if needed)
  const [callChannel, setCallChannel] = useState<string | null>(null);

  // Auth must be declared before any useEffect that references 'user'
  const { user, updateUser, logout } = useAuth();
  const {
    callState,
    startCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    answerCall,
  } = useCall();

  // Agora App ID from Vite env (frontend never needs certificate)
  const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID as string;

  // Debug log (avoid logging secrets)
  useEffect(() => {
    if (user) console.log("[DEBUG] user UID:", user.phone);
  }, [AGORA_APP_ID, callChannel, user]);

  // State for Agora token
  const [agoraToken, setAgoraToken] = useState<string | null>(null);

  // Fetch Agora token (dynamic key mode) once call is answered & channel exists
  useEffect(() => {
    if (!isCallAnswered || !callChannel || !user) {
      setAgoraToken(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/agora-token?channel=${encodeURIComponent(
            callChannel
          )}&uid=${encodeURIComponent(user.phone)}`
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) {
          setAgoraToken(data.token);
          console.log("[DEBUG] Agora token fetched");
        }
      } catch (e) {
        if (!cancelled) {
          console.error("[DEBUG] Failed to fetch Agora token", e);
          setAgoraToken(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isCallAnswered, callChannel, user]);

  // Setup Agora audio hook (only when channel is set and call is answered)
  const agora = useAgoraAudio({
    appId: AGORA_APP_ID,
    channel: callChannel || "",
    token: agoraToken,
    uid: user?.phone,
  });

  // Contacts state is now fetched from backend
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState<string | null>(null);

  // Socket.io setup
  const socketRef = useRef<any>(null);

  // Join/leave Agora when ready (wait for token if required)
  useEffect(() => {
    if (!isCallAnswered || !callChannel) {
      agora.leave();
      return;
    }
    // If token-based auth, wait until token is present
    if (agoraToken === null) {
      // still fetching or failed; don't attempt join yet
      return;
    }
    agora.join();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCallAnswered, callChannel, agoraToken]);

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    socketRef.current = socket;
    if (!socket.connected) socket.connect();
    // Register user by phone number
    socket.emit("register", user.phone);

    // Incoming call
    socket.on("call-incoming", (payload) => {
      // payload: { from, to, channel, ... }
      const contact = contacts.find((c) => c.phone === payload.from) || {
        id: "temp",
        name: payload.from,
        phone: payload.from,
      };
      setCallChannel(payload.channel || null);
      setIsCallAnswered(false);
      startCall(contact, true);
    });

    // Call accepted (other party answered)
    socket.on("call-accepted", (payload) => {
      setIsCallAnswered(true);
      setCallChannel(payload.channel || null);
    });

    // Call declined
    socket.on("call-declined", (payload) => {
      setIsCallAnswered(false);
      setCallChannel(null);
      endCall();
    });

    // Call ended
    socket.on("call-ended", (payload) => {
      setIsCallAnswered(false);
      setCallChannel(null);
      endCall();
    });

    return () => {
      socket.off("call-incoming");
      socket.off("call-accepted");
      socket.off("call-declined");
      socket.off("call-ended");
    };
    // eslint-disable-next-line
  }, [user, contacts, startCall, endCall]);

  const navigate = useNavigate();
  const location = useLocation();

  // const [callLogs, setCallLogs] = useLocalStorage<CallLog[]>(
  //   "hola_call_logs",
  //   []
  // );
  const callLogs: CallLog[] = [];
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Force refresh of ContactList (which self-fetches) after add/update
  const [contactsRefreshKey, setContactsRefreshKey] = useState(0);

  // Load contacts from backend
  useEffect(() => {
    setContactsLoading(true);
    setContactsError(null);
    fetch("/api/contacts", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch contacts");
        return res.json();
      })
      .then((data) => {
        // Ensure all contact IDs are strings
        const contactsWithStringIds = data.map((contact) => ({
          ...contact,
          id: String(contact.id),
        }));
        setContacts(contactsWithStringIds);
        setContactsLoading(false);
      })
      .catch((err) => {
        setContactsError(err.message || "Error loading contacts");
        setContactsLoading(false);
      });
  }, []);

  const handleCall = async (phone: string, name: string) => {
    const contact = contacts.find((c) => c.phone === phone) || {
      id: "temp",
      name,
      phone,
    };
    // Generate channel for Agora (or signaling)
    const channel = `call_${user.phone}_${phone}_${Date.now()}`;
    setCallChannel(channel);
    setIsCallAnswered(false);
    startCall(contact);

    // Log the call in the database
    try {
      await apiService.addCallLog(phone, name, channel);
      console.log("Call logged successfully");
    } catch (error) {
      console.error("Failed to log call:", error);
      // Continue with the call even if logging fails
    }

    // Send call-invite via socket
    if (user && socketRef.current) {
      socketRef.current.emit("call-invite", {
        from: user.phone,
        to: phone,
        channel,
      });
    }
  };

  const handleEndCall = () => {
    // Send call-ended via socket
    if (user && callState.contact && socketRef.current) {
      socketRef.current.emit("call-end", {
        from: user.phone,
        to: callState.contact.phone,
        channel: callChannel,
      });
    }
    setIsCallAnswered(false);
    setCallChannel(null);
    endCall();
  };

  // Accept incoming call
  const handleAnswerCall = () => {
    if (user && callState.contact && socketRef.current) {
      socketRef.current.emit("call-accept", {
        from: user.phone,
        to: callState.contact.phone,
        channel: callChannel,
      });
    }
    setIsCallAnswered(true);
  };

  // Decline incoming call
  const handleDeclineCall = () => {
    if (user && callState.contact && socketRef.current) {
      socketRef.current.emit("call-decline", {
        from: user.phone,
        to: callState.contact.phone,
        channel: callChannel,
      });
    }
    setIsCallAnswered(false);
    setCallChannel(null);
    endCall();
  };

  const handleAddContact = async (contactData: Omit<Contact, "id">) => {
    setIsLoading(true);
    try {
      const newContact = await apiService.addContact(contactData);
      // Normalize id to string and append
      const normalized = {
        ...newContact,
        id: String((newContact as any).id),
      } as Contact;
      setContacts((prev) => [...prev, normalized]);
      // Close modal and bump refresh key so ContactList refetches
      setShowContactForm(false);
      setEditingContact(undefined);
      setContactsRefreshKey((k) => k + 1);
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
      // Normalize id to string and update
      const normalized = {
        ...updatedContact,
        id: String((updatedContact as any).id),
      } as Contact;
      setContacts((prev) =>
        prev.map((c) => (c.id === editingContact.id ? normalized : c))
      );
      // Close modal and bump refresh key so ContactList refetches
      setEditingContact(undefined);
      setShowContactForm(false);
      setContactsRefreshKey((k) => k + 1);
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

  const handleToggleFavorite = async (contactId: string) => {
    try {
      const contact = contacts.find((c) => c.id === contactId);
      if (!contact) return;

      const updatedContact = await apiService.toggleContactFavorite(
        contactId,
        !contact.isFavorite
      );

      // Update local state with the response from backend
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? updatedContact : c))
      );

      // Bump refresh key so ContactList refetches
      setContactsRefreshKey((k) => k + 1);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
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
    console.log("handleSelectConversation called with contactId:", contactId);
    setSelectedContactId(String(contactId));

    // Ensure we're on the messages route
    if (!location.pathname.startsWith("/app/messages")) {
      navigate("/app/messages");
    }
  };

  const handleBackFromChat = () => {
    setSelectedContactId(null);
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone?.includes(searchQuery)
  );

  const selectedContact = selectedContactId
    ? contacts.find((c) => c.id === selectedContactId)
    : null;
  const contactMessages = selectedContactId
    ? messages.filter((m) => m.contactId === selectedContactId)
    : [];

  // Debug logging
  useEffect(() => {
    if (selectedContactId) {
      console.log(
        "selectedContactId:",
        selectedContactId,
        typeof selectedContactId
      );
      console.log("selectedContact:", selectedContact);
      console.log(
        "contacts IDs:",
        contacts.map((c) => ({ id: c.id, name: c.name, idType: typeof c.id }))
      );
    }
  }, [selectedContactId, selectedContact, contacts]);

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
      return {};
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
                    {contactsLoading ? (
                      <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center text-gray-500">
                          Loading contacts...
                        </div>
                      </div>
                    ) : contactsError ? (
                      <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center text-red-500">
                          {contactsError}
                        </div>
                      </div>
                    ) : (
                      <ContactList
                        key={contactsRefreshKey}
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
                    )}
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

      {/* Floating Incoming Call Button and BottomNavigation (if needed) */}
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

      {/* Call Screen (real call only) */}
      <AnimatePresence>
        {callState.isActive && (
          <CallScreen
            callState={callState}
            onEndCall={handleEndCall}
            onToggleMute={toggleMute}
            onToggleSpeaker={toggleSpeaker}
            onAnswerCall={handleAnswerCall}
            declineLabel="Decline"
            answerLabel="Answer"
            showAnswer={callState.isIncoming && !isCallAnswered}
            isAnswered={isCallAnswered}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
