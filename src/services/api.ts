import { Contact, CallLog, Message, Conversation, User } from "../types";
import {
  mockContacts,
  mockCallLogs,
  mockMessages,
  mockConversations,
} from "./mockData";

// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Mock API service - replace with real API calls later
export const apiService = {
  // Auth
  token: null as string | null,

  setToken(token: string | null) {
    if (token) {
      localStorage.setItem("jwt", token);
      this.token = token;
    } else {
      localStorage.removeItem("jwt");
      this.token = null;
    }
  },

  // Persist user record (frontend-only cache)
  setUser(user: User | null) {
    if (user) {
      localStorage.setItem("hola_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("hola_user");
    }
  },

  getUser(): User | null {
    try {
      const raw = localStorage.getItem("hola_user");
      if (!raw) return null;
      return JSON.parse(raw) as User;
    } catch (e) {
      return null;
    }
  },

  clearAuth() {
    this.setToken(null);
    this.setUser(null);
  },

  getToken() {
    if (this.token) return this.token;
    const token = localStorage.getItem("jwt");
    this.token = token;
    return token;
  },

  async login(phone: string, password: string): Promise<User> {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(async () => {
        try {
          const text = await res.text();
          return { raw: text };
        } catch (e) {
          return {};
        }
      });
      console.error("[apiService.login] failed", {
        status: res.status,
        body: data,
      });
      throw new Error(data.error || data.message || "Login failed");
    }
    const data = await res.json();
    console.debug("[apiService.login] success", {
      status: res.status,
      user: data.user,
    });
    if (data.token) this.setToken(data.token);
    if (data.user) this.setUser(data.user);
    return data.user;
  },

  // Return stored user from localStorage. No network call by design.
  async getCurrentUser(): Promise<User> {
    const user = this.getUser();
    if (!user) throw new Error("No user in storage");
    return user;
  },

  async register(name: string, phone: string, password: string): Promise<User> {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Registration failed");
    }
    return await res.json();
  },

  async verifyCode(phone: string, code: string): Promise<boolean> {
    await delay(1000);
    // Simulate verification - accept any 6-digit code
    return code.length === 6;
  },

  async truecallerLogin(): Promise<User> {
    await delay(2000);
    return {
      id: "truecaller_user",
      name: "Truecaller User",
      phone: "+1987654321",
      avatar:
        "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
    };
  },

  // Contacts
  async getContacts(): Promise<Contact[]> {
    await delay(500);
    return [...mockContacts];
  },

  async addContact(contact: Omit<Contact, "id">): Promise<Contact> {
    await delay(500);
    return {
      ...contact,
      id: `contact_${Date.now()}`,
    };
  },

  async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    await delay(500);
    const contact = mockContacts.find((c) => c.id === id);
    if (!contact) throw new Error("Contact not found");
    return { ...contact, ...updates };
  },

  async deleteContact(id: string): Promise<void> {
    await delay(500);
    // In real implementation, this would delete from backend
  },

  // Call logs
  async getCallLogs(): Promise<CallLog[]> {
    await delay(500);
    return [...mockCallLogs];
  },

  async addCallLog(callLog: Omit<CallLog, "id">): Promise<CallLog> {
    await delay(300);
    return {
      ...callLog,
      id: `call_${Date.now()}`,
    };
  },

  // Messages
  async getConversations(): Promise<Conversation[]> {
    await delay(500);
    return [...mockConversations];
  },

  async getMessages(contactId: string): Promise<Message[]> {
    await delay(500);
    return mockMessages.filter((m) => m.contactId === contactId);
  },

  async sendMessage(contactId: string, content: string): Promise<Message> {
    await delay(300);
    return {
      id: `msg_${Date.now()}`,
      contactId,
      content,
      timestamp: new Date(),
      isOutgoing: true,
      isRead: true,
    };
  },

  // User profile
  async updateProfile(updates: Partial<User>): Promise<User> {
    await delay(500);
    // Return updated user - in real app, this would update backend
    return {
      id: "user1",
      name: "John Doe",
      phone: "+1234567890",
      ...updates,
    };
  },
};
