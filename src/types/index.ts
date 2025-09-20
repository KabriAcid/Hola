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

export interface MessageStatus {
  id: number;
  message_id: number;
  user_id: number;
  status: "sent" | "delivered" | "read";
  timestamp: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content?: string;
  message_type: "text" | "image" | "audio" | "video" | "file" | "system";
  file_url?: string;
  file_size?: number;
  file_name?: string;
  reply_to_message_id?: number;
  created_at: string;
  edited_at?: string;
  deleted_at?: string;
  is_own?: boolean; // Computed field to check if message is from current user
  sender?: {
    id: number;
    full_name: string;
    avatar?: string;
  };
  status?: MessageStatus[]; // Message delivery status
}

export interface ConversationParticipant {
  id: number;
  conversation_id: number;
  user_id: number;
  joined_at: string;
  role: "member" | "admin";
  is_muted: boolean;
  last_read_message_id?: number;
  user?: {
    id: number;
    full_name: string;
    avatar?: string;
    status?: "online" | "offline" | "away" | "busy";
    last_seen?: string;
  };
}

export interface Conversation {
  id: number;
  type: "direct" | "group";
  name?: string;
  avatar?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  participants?: ConversationParticipant[];
  last_message?: Message;
  unread_count?: number;
}

export interface UserPresence {
  user_id: number;
  status: "online" | "offline" | "away" | "busy";
  last_seen: string;
  custom_status?: string;
  socket_id?: string;
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
