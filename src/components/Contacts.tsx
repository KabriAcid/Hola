import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, UserPlus } from 'lucide-react';
import { ContactCard } from './ContactCard';
import { Contact } from '../types';

interface ContactsProps {
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
}

export const Contacts: React.FC<ContactsProps> = ({ contacts, onContactClick }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter(contact =>
    (contact.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (contact.phone?.includes(searchQuery))
  );

  // Group contacts by first letter
  const groupedContacts = filteredContacts.reduce((groups, contact) => {
    const firstLetter = contact.name ? contact.name[0].toUpperCase() : '#';
    if (!groups[firstLetter]) {
      groups[firstLetter] = [];
    }
    groups[firstLetter].push(contact);
    return groups;
  }, {} as Record<string, Contact[]>);

  const sortedGroups = Object.keys(groupedContacts).sort();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white h-full flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Contacts</h1>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <UserPlus className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-y-auto">
        {sortedGroups.map((letter) => (
          <div key={letter} className="px-4">
            <div className="sticky top-0 bg-white py-2 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {letter}
              </h3>
            </div>
            <div className="py-2">
              {groupedContacts[letter].map((contact, index) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ContactCard
                    contact={contact}
                    onClick={() => onContactClick(contact)}
                    variant="favorite"
                  />
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {filteredContacts.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
              <p className="text-gray-500">Try adjusting your search terms</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};