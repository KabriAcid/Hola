import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import { MessageCircle, Search, X } from "lucide-react";
import { Contact } from "../../types";
import { Avatar } from "../ui/Avatar";
import { apiService } from "../../services/api";

interface ConversationListProps {
  onSelectConversation: (contactId: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  onSelectConversation,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Load contacts on component mount
  useEffect(() => {
    const loadContacts = async () => {
      setContactsLoading(true);
      try {
        const allContacts = await apiService.getContacts();
        const contactsWithStringIds = allContacts.map((contact) => ({
          ...contact,
          id: String(contact.id),
        }));
        setContacts(contactsWithStringIds);
      } catch (error) {
        console.error("Error loading contacts:", error);
        setContacts([]);
      } finally {
        setContactsLoading(false);
      }
    };

    loadContacts();
  }, []);

  // Debounced search function
  const performSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const contacts = await apiService.getContacts();
      const filtered = contacts.filter(
        (contact) =>
          contact.name.toLowerCase().includes(query.toLowerCase()) ||
          contact.phone.includes(query)
      );
      // Ensure all contact IDs are strings
      const filteredWithStringIds = filtered.map((contact) => ({
        ...contact,
        id: String(contact.id),
      }));
      setSearchResults(filteredWithStringIds);
      setShowDropdown(true);
    } catch (error) {
      console.error("Error searching contacts:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced search
    timeoutRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  };

  // Handle contact selection
  const handleContactSelect = (contact: Contact) => {
    console.log("Contact selected:", contact);
    setShowDropdown(false);
    setSearchQuery("");
    setSearchResults([]);
    onSelectConversation(String(contact.id));
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
    searchInputRef.current?.focus();
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="p-4 border-b border-gray-200 bg-white relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search contacts..."
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-full leading-5 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-black focus:ring-0 text-base"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && (
          <>
            {/* Mobile Full Screen Overlay */}
            <div className="md:hidden">
              {ReactDOM.createPortal(
                <div className="fixed inset-0 z-50 bg-white">
                  <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Search contacts..."
                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-full leading-5 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:bg-white focus:border-black focus:ring-0 text-base"
                        autoFocus
                      />
                      <button
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <X className="h-5 w-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {isSearching ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="text-gray-500">Searching...</div>
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((contact, index) => (
                        <motion.div
                          key={contact.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                          onClick={() => handleContactSelect(contact)}
                        >
                          <Avatar
                            src={contact.avatar}
                            alt={contact.name}
                            size="md"
                            isOnline={contact.isOnline}
                          />
                          <div className="ml-3 flex-1">
                            <h3 className="font-medium text-gray-900">
                              {contact.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {contact.phone}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center p-8">
                        <div className="text-center">
                          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No contacts found</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>,
                document.body
              )}
            </div>

            {/* Desktop Dropdown */}
            <div
              ref={dropdownRef}
              className="hidden md:block absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
            >
              {isSearching ? (
                <div className="flex items-center justify-center p-6">
                  <div className="text-gray-500">Searching...</div>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((contact, index) => (
                  <motion.div
                    key={contact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleContactSelect(contact)}
                  >
                    <Avatar
                      src={contact.avatar}
                      alt={contact.name}
                      size="md"
                      isOnline={contact.isOnline}
                    />
                    <div className="ml-3 flex-1">
                      <h3 className="font-medium text-gray-900">
                        {contact.name}
                      </h3>
                      <p className="text-sm text-gray-600">{contact.phone}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex items-center justify-center p-6">
                  <div className="text-center">
                    <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No contacts found</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Quick Contact Avatars */}
      {!contactsLoading && contacts.length > 0 && (
        <div className="p-4 border-b border-gray-200 bg-white">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Quick Message
          </h4>
          <div className="flex space-x-3 overflow-x-auto scrollbar-none pb-2">
            {contacts.map((contact) => (
              <motion.div
                key={contact.id}
                className="flex-shrink-0 flex flex-col items-center cursor-pointer group"
                onClick={() => handleContactSelect(contact)}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative">
                  <Avatar
                    src={`/assets/avatars/${contact.avatar}`}
                    alt={contact.name}
                    size="lg"
                    isOnline={contact.isOnline}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-full transition-all duration-200" />
                </div>
                <span className="text-xs text-gray-600 mt-2 text-center max-w-[60px] truncate group-hover:text-gray-900 transition-colors">
                  {contact.name.split(" ")[0]}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content - Empty State */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-10 h-10 text-gray-400" />
          </div>
          {contacts.length > 0 ? (
            <>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                Start a conversation
              </h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                Search for contacts above or tap on an avatar to start messaging
              </p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-medium text-gray-900 mb-3">
                No contacts yet
              </h3>
              <p className="text-gray-600 max-w-sm mx-auto">
                Add some contacts first to start messaging
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
