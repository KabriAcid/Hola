import React from 'react';
import { motion } from 'framer-motion';
import { Phone, PhoneCall, PhoneMissed, Heart } from 'lucide-react';
import { Contact } from '../types';

interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
  showFavoriteIcon?: boolean;
  variant?: 'call-history' | 'favorite';
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onClick,
  showFavoriteIcon = false,
  variant = 'call-history',
}) => {
  const getCallIcon = () => {
    switch (contact.callType) {
      case 'incoming':
        return <PhoneCall className="w-4 h-4 text-primary-500" />;
      case 'outgoing':
        return <Phone className="w-4 h-4 text-gray-400 rotate-12" />;
      case 'missed':
        return <PhoneMissed className="w-4 h-4 text-red-500" />;
    }
  };

  const getAvatarBgColor = () => {
    if (contact.initials === '+') return 'bg-accent-blue-100 text-accent-blue-600';
    if (contact.initials === 'D') return 'bg-gray-100 text-gray-600';
    return 'bg-gray-100 text-gray-700';
  };

  const displayName = contact.name || contact.phone;
  const isNameRed = contact.name === 'Sitarama Shastry' || contact.name === 'Tyrion Lannister';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center justify-between py-3 px-1 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <motion.div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium ${getAvatarBgColor()}`}
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {contact.initials}
        </motion.div>
        
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${isNameRed ? 'text-red-500' : 'text-gray-900'}`}>
            {displayName}
          </h3>
          {contact.label && (
            <p className="text-xs text-gray-500">{contact.label}</p>
          )}
          {variant === 'call-history' && (
            <p className="text-xs text-gray-500">{contact.lastCallTime}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {showFavoriteIcon && (
          <motion.div
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart className="w-5 h-5 text-accent-pink-500 fill-current" />
          </motion.div>
        )}
        
        {variant === 'call-history' && (
          <motion.div
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            {getCallIcon()}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};