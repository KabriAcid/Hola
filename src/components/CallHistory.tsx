import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash, Trash2 } from 'lucide-react';
import { ContactCard } from './ContactCard';
import { Contact, CallHistoryTab } from '../types';

interface CallHistoryProps {
  contacts: Contact[];
  onContactClick: (contact: Contact) => void;
}

export const CallHistory: React.FC<CallHistoryProps> = ({ contacts, onContactClick }) => {
  const [activeTab, setActiveTab] = useState<CallHistoryTab>('all');
  
  const filteredContacts = activeTab === 'all' 
    ? contacts 
    : contacts.filter(contact => contact.callType === 'missed');

  const handleDeleteContact = (contactId: string) => {
    // Handle delete functionality
    console.log('Delete contact:', contactId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white h-full flex flex-col"
    >
      {/* Header with tabs and search */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex space-x-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('all')}
            className={`text-sm font-medium pb-1 transition-colors ${
              activeTab === 'all' 
                ? 'text-gray-900 border-b-2 border-accent-blue-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('missed')}
            className={`text-sm font-medium pb-1 transition-colors ${
              activeTab === 'missed' 
                ? 'text-gray-900 border-b-2 border-accent-blue-500' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Missed
          </motion.button>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Search className="w-5 h-5 text-gray-500" />
        </motion.button>
      </div>

      {/* Call list */}
      <div className="flex-1 overflow-y-auto px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {filteredContacts.map((contact) => (
              <div key={contact.id} className="group relative">
                <ContactCard
                  contact={contact}
                  onClick={() => onContactClick(contact)}
                  variant="call-history"
                />
                
                {/* Special delete button for Daniel Radcliff */}
                {contact.name === 'Daniel Radcliff' && (
                  <motion.button
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteContact(contact.id)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-accent-blue-500 text-sm font-medium"
                  >
                  </motion.button>
                )}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};