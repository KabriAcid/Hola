export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  isOnline?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  isFavorite?: boolean;
  isOnline?: boolean;
  email?: string;
  label?: string;
  notes?: string;
}

export interface CallLog {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  contactAvatar?: string;
  type: "incoming" | "outgoing" | "missed";
  duration?: number;
  timestamp: Date;
  count?: number; // For grouped calls (iPhone-style)
}

export interface Message {
  id: string;
  contactId: string;
  content: string;
  timestamp: Date;
  isOutgoing: boolean;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string;
  contactAvatar?: string;
  lastMessage: Message;
  unreadCount: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
}

export interface CallState {
  isActive: boolean;
  contact: Contact | null;
  duration: number;
  isMuted: boolean;
  isSpeakerOn: boolean;
  isIncoming: boolean;
}

export type LoginMethod = "truecaller" | "phone";

export type TabType = "recents" | "contacts" | "messages" | "settings";
