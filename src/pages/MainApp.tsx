import React, { useState, useEffect } from "react";
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
import { ContactList } from "../components/contacts/ContactList";
import { ContactForm } from "../components/contacts/ContactForm";
import { ConversationList } from "../components/messages/ConversationList";
import { ChatScreen } from "../components/messages/ChatScreen";
import { SettingsScreen } from "../components/settings/SettingsScreen";
import { CallScreen } from "../components/calls/CallScreen";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";
import { useCall } from "../hooks/useCall";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { apiService } from "../services/api";
import { Contact, CallLog, Conversation, Message } from "../types";

export const MainApp: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const {
    callState,
    startCall,
    endCall,
    toggleMute,
    toggleSpeaker,
    answerCall,
  } = useCall();

  const navigate = useNavigate();
  const location = useLocation();
  const [contacts, setContacts] = useLocalStorage<Contact[]>(
    "hola_contacts",
    []
  );
  const [callLogs, setCallLogs] = useLocalStorage<CallLog[]>(
    "hola_call_logs",
    []
  );
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
        if (callLogs.length === 0) setCallLogs(callLogsData);
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

    // Add to call logs
    const newCallLog: CallLog = {
      id: `call_${Date.now()}`,
      contactId: contact.id,
      contactName: contact.name,
      contactPhone: contact.phone,
      contactAvatar: contact.avatar,
      type: "outgoing",
      timestamp: new Date(),
    };
    setCallLogs((prev) => [newCallLog, ...prev]);
  };

  const handleEndCall = () => {
    if (callState.contact && callState.duration > 0) {
      // Update call log with duration
      setCallLogs((prev) =>
        prev.map((log) =>
          log.contactId === callState.contact?.id && !log.duration
            ? { ...log, duration: callState.duration }
            : log
        )
      );
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

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header title={getHeaderTitle()} {...getHeaderProps()} />

      <div className="flex-1 overflow-hidden">
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
                      callLogs={callLogs}
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
                    <SettingsScreen
                      user={user}
                      onUpdateProfile={updateUser}
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
      <AnimatePresence>
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
