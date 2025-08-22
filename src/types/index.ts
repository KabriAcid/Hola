export interface Contact {
  id: string;
  name: string;
  phone?: string;
  avatar?: string;
  initials: string;
  lastCallTime: string;
  callType: "incoming" | "outgoing" | "missed";
  isFavorite?: boolean;
  label?: string;
}

export interface Group {
  id: string;
  name: string;
  memberCount: number;
  color: "green" | "pink" | "blue";
  isNewGroup?: boolean;
}

export type TabType = "recents" | "contacts" | "settings";
export type CallHistoryTab = "all" | "missed";

export type AuthScreen = "splash" | "auth" | "register" | "login" | "app";
export type RegisterMethod = "truecaller" | "phone";

export interface CallState {
  isActive: boolean;
  contact: Contact | null;
  duration: number;
  isMuted: boolean;
  isSpeakerOn: boolean;
  isVideoCall: boolean;
}
