import React from 'react';
import { motion } from 'framer-motion';
import { Phone, MessageCircle, Star, Edit, Trash2 } from 'lucide-react';
import { Contact } from '../../types';
import { Avatar } from '../ui/Avatar';

interface ContactListProps {
  contacts: Contact[];
  onCall: (contact: Contact) => void;
  onMessage: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
  onToggleFavorite: (contactId: string) => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  onCall,
  onMessage,
  onEdit,
  onDelete,
  onToggleFavorite,
}) => {
  const favorites = contacts.filter(c => c.isFavorite);
  const regular = contacts.filter(c => !c.isFavorite);

  const ContactItem: React.FC<{ contact: Contact; index: number }> = ({ contact, index }) => (
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
        
        <div className="relative group">
          <motion.button
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </motion.button>
          
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
            <button
              onClick={() => onEdit(contact)}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              Edit Contact
            </button>
            <button
              onClick={() => onToggleFavorite(contact.id)}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
            >
              {contact.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
            </button>
            <button
              onClick={() => onDelete(contact.id)}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete Contact
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
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
            <ContactItem key={contact.id} contact={contact} index={favorites.length + index} />
          ))}
        </div>
      )}
      
      {contacts.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h3>
            <p className="text-gray-600">Add your first contact to get started</p>
          </div>
        </div>
      )}
    </div>
  );
};