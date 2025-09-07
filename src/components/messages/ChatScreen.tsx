import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Phone } from 'lucide-react';
import { Message, Contact } from '../../types';
import { Avatar } from '../ui/Avatar';

interface ChatScreenProps {
  contact: Contact;
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  onBack: () => void;
  onCall: (contact: Contact) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  contact,
  messages,
  onSendMessage,
  onBack,
  onCall,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsLoading(true);

    try {
      await onSendMessage(messageContent);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 border-b border-gray-200 bg-white"
      >
        <div className="flex items-center">
          <motion.button
            onClick={onBack}
            className="p-2 -ml-2 mr-2 hover:bg-gray-100 rounded-full transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
          
          <Avatar
            src={contact.avatar}
            alt={contact.name}
            size="md"
            isOnline={contact.isOnline}
          />
          
          <div className="ml-3">
            <h2 className="font-semibold text-black">{contact.name}</h2>
            <p className="text-sm text-gray-600">
              {contact.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        
        <motion.button
          onClick={() => onCall(contact)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          <Phone className="w-6 h-6 text-green-600" />
        </motion.button>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex ${message.isOutgoing ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.isOutgoing
                  ? 'bg-black text-white rounded-br-md'
                  : 'bg-gray-100 text-black rounded-bl-md'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.isOutgoing ? 'text-gray-300' : 'text-gray-500'
                }`}
              >
                {formatTime(message.timestamp)}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <motion.form
        onSubmit={handleSendMessage}
        className="p-4 border-t border-gray-200 bg-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:border-black transition-colors"
            disabled={isLoading}
          />
          <motion.button
            type="submit"
            disabled={!newMessage.trim() || isLoading}
            className="p-3 bg-black text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
};