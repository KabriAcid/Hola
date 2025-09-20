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
  Search,
} from "lucide-react";
import { Contact } from "../../types";
import { Avatar } from "../ui/Avatar";
import { ContactForm } from "./ContactForm";
import { apiService } from "../../services/api";
import { LoadingSpinner } from "../ui/LoadingSpinner";

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
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    apiService
      .getContacts()
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
        <div
          className="flex items-center flex-1 cursor-pointer"
          onClick={() => onCall(contact)}
        >
          <Avatar
            src={`/assets/avatars/${contact.avatar}`}
            alt={contact.name}
            size="md"
            isOnline={contact.isOnline}
          />
          <div className="ml-3 flex-1">
            <div className="flex items-center">
              <h3 className="font-medium text-black">{contact.name}</h3>
              {!!contact.isFavorite && (
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
                    onClick={async () => {
                      setDropdownOpen(null);
                      try {
                        const updatedContact =
                          await apiService.toggleContactFavorite(
                            contact.id,
                            !contact.isFavorite
                          );
                        setContacts((prev) =>
                          prev.map((c) =>
                            c.id === contact.id ? updatedContact : c
                          )
                        );
                      } catch (err) {
                        setError(
                          (err as Error).message || "Error toggling favorite"
                        );
                      }
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
    setError(null); // Clear any errors when editing
    setEditContact(contact);
    setShowAddModal(true);
  };

  const handleDelete = async (contactId: string) => {
    try {
      await apiService.deleteContact(contactId);
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
    } catch (err) {
      setError((err as Error).message || "Error deleting contact");
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Filter contacts based on search query
  const filteredContacts = searchQuery
    ? contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phone.includes(searchQuery)
      )
    : contacts;

  // Split filtered contacts into favorites and regular
  const favorites = filteredContacts.filter((c) => c.isFavorite);
  const regular = filteredContacts.filter((c) => !c.isFavorite);

  return (
    <div className="flex-1 overflow-y-auto">
      {loading ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <LoadingSpinner size="md" />
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-red-500">{error}</div>
        </div>
      ) : (
        <>
          {/* Search Field */}
          <div className="px-4 py-3 border-b border-gray-200 bg-white">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search contacts..."
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-black placeholder-gray-400 focus:outline-none focus:border-black text-sm"
              />
            </div>
          </div>

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
          {filteredContacts.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-gray-400" />
                </div>
                {searchQuery ? (
                  <>
                    <h3 className="text-lg font-medium text-black mb-2">
                      No results found
                    </h3>
                    <p className="text-gray-600">
                      Try adjusting your search terms
                    </p>
                  </>
                ) : contacts.length === 0 ? (
                  <>
                    <h3 className="text-lg font-medium text-black mb-2">
                      No contacts yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Add your first contact to get started
                    </p>
                    <button
                      className="inline-block px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                      onClick={() => {
                        setError(null); // Clear any errors when opening modal
                        setShowAddModal(true);
                      }}
                    >
                      Add Contact
                    </button>
                  </>
                ) : null}
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

              // Check for duplicate phone numbers (excluding current contact for edits)
              const duplicateContact = contacts.find(
                (c) =>
                  c.phone === contact.phone &&
                  (!editContact || c.id !== editContact.id)
              );

              if (duplicateContact) {
                setError(
                  `A contact with phone number ${contact.phone} already exists: ${duplicateContact.name}`
                );
                setIsSaving(false);
                return;
              }

              try {
                if (editContact) {
                  console.log("[EditContact] Updating contact:", contact);
                  const updatedContact = await apiService.updateContact(
                    editContact.id,
                    {
                      name: contact.name,
                      phone: contact.phone,
                      email: contact.email,
                      isFavorite: contact.isFavorite,
                      avatar: contact.avatar,
                      avatarFile: (contact as any).avatarFile,
                    }
                  );
                  setContacts((prev) =>
                    prev.map((c) =>
                      c.id === editContact.id ? updatedContact : c
                    )
                  );
                } else {
                  const newContact = await apiService.addContact({
                    name: contact.name,
                    phone: contact.phone,
                    email: contact.email,
                    isFavorite: contact.isFavorite,
                    avatar: contact.avatar,
                    isOnline: false,
                    avatarFile: (contact as any).avatarFile,
                  });
                  setContacts((prev) => {
                    const updated = [...prev, newContact];
                    return updated;
                  });
                }

                // Clear any previous errors and force close modal
                setError(null);
                setShowAddModal(false);
                setEditContact(null);
              } catch (err) {
                console.error(
                  editContact ? "[EditContact] Error:" : "[AddContact] Error:",
                  err
                );
                console.error("Full error details:", err);
                setError(
                  (err as Error).message ||
                    (editContact
                      ? "Error updating contact"
                      : "Error adding contact")
                );

                // Force close modal even on error since backend works fine
                setShowAddModal(false);
                setEditContact(null);
                console.log("[ContactList] Modal force closed after error");
              } finally {
                setIsSaving(false);
              }
            }}
            onClose={() => {
              setShowAddModal(false);
              setEditContact(null);
              setError(null); // Clear any errors when closing modal
            }}
          />
        </>
      )}
    </div>
  );
};
