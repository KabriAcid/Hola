import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import {
  Phone,
  MessageCircle,
  Star,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { Contact } from "../../types";
import { Avatar } from "../ui/Avatar";
import { ContactForm } from "./ContactForm";

interface ContactListProps {
  onCall: (contact: Contact) => void;
  onMessage: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
  onToggleFavorite: (contactId: string) => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  onCall,
  onMessage,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
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
        setContacts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Error loading contacts");
        setLoading(false);
      });
  }, []);
  // ContactItem component
  const ContactItem: React.FC<{ contact: Contact; index: number }> = ({
    contact,
    index,
  }) => {
    const itemEllipsisRef = useRef<HTMLButtonElement | null>(null);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="flex items-center justify-between p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center flex-1">
          <Avatar
            src={contact.avatar}
            alt={contact.name}
            size="md"
            isOnline={contact.isOnline}
          />
          <div className="ml-3 flex-1">
            <div className="flex items-center">
              <h3 className="font-medium text-black">{contact.name}</h3>
              {contact.isFavorite && (
                <Star className="w-4 h-4 ml-2 text-yellow-500 fill-current" />
              )}
            </div>
            <p className="text-sm text-gray-600">{contact.phone}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 relative">
          <motion.button
            onClick={() => onMessage(contact)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <MessageCircle className="w-5 h-5 text-gray-600" />
          </motion.button>

          <motion.button
            onClick={() => onCall(contact)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Phone className="w-5 h-5 text-green-600" />
          </motion.button>

          {/* Ellipsis Dropdown */}
          <motion.button
            ref={itemEllipsisRef}
            onClick={() => {
              if (dropdownOpen === contact.id) {
                setDropdownOpen(null);
              } else {
                if (itemEllipsisRef.current) {
                  const rect = itemEllipsisRef.current.getBoundingClientRect();
                  setDropdownPos({
                    top: rect.bottom + window.scrollY + 4,
                    left: rect.right - 160,
                  });
                }
                setDropdownOpen(contact.id);
              }
            }}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </motion.button>
          {dropdownOpen === contact.id &&
            dropdownPos &&
            ReactDOM.createPortal(
              <>
                {/* Transparent overlay to catch outside clicks */}
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    zIndex: 9998,
                    background: "transparent",
                  }}
                  onClick={() => setDropdownOpen(null)}
                />
                {/* Actual dropdown menu */}
                <div
                  style={{
                    position: "absolute",
                    top: dropdownPos.top,
                    left: dropdownPos.left,
                    zIndex: 9999,
                    minWidth: 160,
                  }}
                  className="bg-white border border-gray-200 rounded-lg shadow-lg min-w-[140px] py-2 flex flex-col"
                >
                  <button
                    className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                    onClick={() => {
                      setDropdownOpen(null);
                      handleEdit(contact);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2 text-gray-600" /> Edit
                  </button>
                  <button
                    className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                    onClick={() => {
                      setDropdownOpen(null);
                      onToggleFavorite(contact.id);
                    }}
                  >
                    {contact.isFavorite ? (
                      <Star className="w-4 h-4 mr-2 text-yellow-500 fill-current" />
                    ) : (
                      <Star className="w-4 h-4 mr-2 text-gray-400" />
                    )}
                    {contact.isFavorite ? "Unfavorite" : "Favorite"}
                  </button>
                  <button
                    className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
                    onClick={() => {
                      setDropdownOpen(null);
                      handleDelete(contact.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2 text-red-600" /> Delete
                  </button>
                </div>
              </>,
              document.body
            )}
        </div>
      </motion.div>
    );
  };

  // Helper functions for edit and delete
  const handleEdit = (contact: Contact) => {
    setEditContact(contact);
    setShowAddModal(true);
  };

  const handleDelete = async (contactId: string) => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete contact");
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
    } catch (err) {
      setError((err as Error).message || "Error deleting contact");
    }
  };

  // Split contacts into favorites and regular
  const favorites = contacts.filter((c) => c.isFavorite);
  const regular = contacts.filter((c) => !c.isFavorite);

  return (
    <div className="flex-1 overflow-y-auto">
      {loading ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-gray-500">Loading contacts...</div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-red-500">{error}</div>
        </div>
      ) : (
        <>
          {favorites.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-black px-4 py-2 bg-gray-50">
                Favorites
              </h2>
              {favorites.map((contact, index) => (
                <ContactItem key={contact.id} contact={contact} index={index} />
              ))}
            </div>
          )}
          {regular.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-black px-4 py-2 bg-gray-50">
                All Contacts
              </h2>
              {regular.map((contact, index) => (
                <ContactItem
                  key={contact.id}
                  contact={contact}
                  index={favorites.length + index}
                />
              ))}
            </div>
          )}
          {contacts.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No contacts yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Add your first contact to get started
                </p>
                <button
                  className="inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium"
                  onClick={() => setShowAddModal(true)}
                >
                  Add Contact
                </button>
              </div>
            </div>
          )}

          {/* Add/Edit Contact Modal */}
          <ContactForm
            isOpen={showAddModal}
            contact={editContact || undefined}
            isLoading={isSaving}
            onSave={async (contact) => {
              setIsSaving(true);
              try {
                const formData = new FormData();
                formData.append("name", contact.name);
                formData.append("phone", contact.phone);
                formData.append("email", contact.email || "");
                formData.append("isFavorite", contact.isFavorite ? "1" : "0");
                if ((contact as any).avatarFile) {
                  formData.append("avatar", (contact as any).avatarFile);
                } else if (contact.avatar) {
                  formData.append("avatar", contact.avatar);
                }
                if (editContact) {
                  console.log("[EditContact] Submitting contact:", contact);
                  formData.forEach((value, key) => {
                    console.log(`[EditContact] FormData: ${key} =`, value);
                  });
                  const res = await fetch(`/api/contacts/${editContact.id}`, {
                    method: "PUT",
                    headers: {
                      Authorization: `Bearer ${
                        localStorage.getItem("jwt") || ""
                      }`,
                    },
                    body: formData,
                  });
                  console.log("[EditContact] Response status:", res.status);
                  if (!res.ok) throw new Error("Failed to update contact");
                  const updatedContact = await res.json();
                  setContacts((prev) =>
                    prev.map((c) =>
                      c.id === editContact.id ? updatedContact : c
                    )
                  );
                } else {
                  console.log("[AddContact] Submitting contact:", contact);
                  formData.forEach((value, key) => {
                    console.log(`[AddContact] FormData: ${key} =`, value);
                  });
                  const res = await fetch("/api/contacts", {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${
                        localStorage.getItem("jwt") || ""
                      }`,
                    },
                    body: formData,
                  });
                  console.log("[AddContact] Response status:", res.status);
                  if (!res.ok) throw new Error("Failed to add contact");
                  const newContact = await res.json();
                  setContacts((prev) => [...prev, newContact]);
                }
                setShowAddModal(false);
                setEditContact(null);
              } catch (err) {
                console.error(
                  editContact ? "[EditContact] Error:" : "[AddContact] Error:",
                  err
                );
                setError(
                  (err as Error).message ||
                    (editContact
                      ? "Error updating contact"
                      : "Error adding contact")
                );
              } finally {
                setIsSaving(false);
              }
            }}
            onClose={() => {
              setShowAddModal(false);
              setEditContact(null);
            }}
          />
        </>
      )}
    </div>
  );
};
