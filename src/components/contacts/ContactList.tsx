import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Phone, MessageCircle, Star, Edit, Trash2 } from "lucide-react";
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
  // Add or Edit Contact handler
  const handleAddContact = async (
    contact: Omit<Contact, "id"> & { avatarFile?: File | null }
  ) => {
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
      let newContact;
      if (editContact) {
        // TODO: Implement PUT /api/contacts/:id for editing
        // For now, just close modal
        setEditContact(null);
        setShowAddModal(false);
        setIsSaving(false);
        return;
      } else {
        const res = await fetch("/api/contacts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
          },
          body: formData,
        });
        if (!res.ok) throw new Error("Failed to add contact");
        newContact = await res.json();
        setContacts((prev) => [...prev, newContact]);
      }
      setShowAddModal(false);
      setEditContact(null);
    } catch (err) {
      setError((err as Error).message || "Error adding contact");
    } finally {
      setIsSaving(false);
    }
  };

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

  // Handlers to update state after edit/delete/favorite
  const handleDelete = (contactId: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    onDelete(contactId);
  };
  const handleToggleFavorite = (contactId: string) => {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId ? { ...c, isFavorite: !c.isFavorite } : c
      )
    );
    onToggleFavorite(contactId);
  };
  const handleEdit = (contact: Contact) => {
    setEditContact(contact);
    setShowAddModal(true);
  };

  const favorites = contacts.filter((c) => c.isFavorite);
  const regular = contacts.filter((c) => !c.isFavorite);

  const ContactItem: React.FC<{ contact: Contact; index: number }> = ({
    contact,
    index,
  }) => (
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

      <div className="flex items-center space-x-2">
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

        <motion.button
          onClick={() => handleEdit(contact)}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          <Edit className="w-4 h-4 text-gray-600" />
        </motion.button>

        <motion.button
          onClick={() => onToggleFavorite(contact.id)}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          {contact.isFavorite ? (
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
          ) : (
            <Star className="w-4 h-4 text-gray-400" />
          )}
        </motion.button>

        <motion.button
          onClick={() => onDelete(contact.id)}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </motion.button>
      </div>
    </motion.div>
  );

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
            onSave={handleAddContact}
            onClose={() => {
              setShowAddModal(false);
              setEditContact(null);
            }}
            isLoading={isSaving}
          />
        </>
      )}
    </div>
  );
};
