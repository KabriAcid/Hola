import { Contact, CallLog, Message, Conversation } from '../types';

export const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    phone: '+1234567890',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    isFavorite: true,
    isOnline: true,
  },
  {
    id: '2',
    name: 'Bob Smith',
    phone: '+1234567891',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    isFavorite: false,
    isOnline: false,
  },
  {
    id: '3',
    name: 'Carol Davis',
    phone: '+1234567892',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    isFavorite: true,
    isOnline: true,
  },
  {
    id: '4',
    name: 'David Wilson',
    phone: '+1234567893',
    isFavorite: false,
    isOnline: false,
  },
  {
    id: '5',
    name: 'Emma Brown',
    phone: '+1234567894',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    isFavorite: false,
    isOnline: true,
  },
];

export const mockCallLogs: CallLog[] = [
  {
    id: '1',
    contactId: '1',
    contactName: 'Alice Johnson',
    contactPhone: '+1234567890',
    contactAvatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    type: 'outgoing',
    duration: 180,
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
  {
    id: '2',
    contactId: '2',
    contactName: 'Bob Smith',
    contactPhone: '+1234567891',
    contactAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    type: 'incoming',
    duration: 240,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: '3',
    contactId: '3',
    contactName: 'Carol Davis',
    contactPhone: '+1234567892',
    contactAvatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    type: 'missed',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
  },
  {
    id: '4',
    contactId: '4',
    contactName: 'David Wilson',
    contactPhone: '+1234567893',
    type: 'outgoing',
    duration: 120,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
];

export const mockMessages: Message[] = [
  {
    id: '1',
    contactId: '1',
    content: 'Hey! How are you doing?',
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    isOutgoing: false,
    isRead: true,
  },
  {
    id: '2',
    contactId: '1',
    content: 'I\'m doing great! Thanks for asking.',
    timestamp: new Date(Date.now() - 1000 * 60 * 8),
    isOutgoing: true,
    isRead: true,
  },
  {
    id: '3',
    contactId: '2',
    content: 'Can we schedule a call for tomorrow?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    isOutgoing: false,
    isRead: false,
  },
  {
    id: '4',
    contactId: '3',
    content: 'Thanks for the call earlier!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isOutgoing: false,
    isRead: true,
  },
];

export const mockConversations: Conversation[] = [
  {
    id: '1',
    contactId: '1',
    contactName: 'Alice Johnson',
    contactPhone: '+1234567890',
    contactAvatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    lastMessage: mockMessages[1],
    unreadCount: 0,
  },
  {
    id: '2',
    contactId: '2',
    contactName: 'Bob Smith',
    contactPhone: '+1234567891',
    contactAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    lastMessage: mockMessages[2],
    unreadCount: 1,
  },
  {
    id: '3',
    contactId: '3',
    contactName: 'Carol Davis',
    contactPhone: '+1234567892',
    contactAvatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
    lastMessage: mockMessages[3],
    unreadCount: 0,
  },
];