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
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Login failed");
    }
    const data = await res.json();
    if (data.token) this.setToken(data.token);
    return data.user;
  },

  async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) throw new Error("No token");
    const res = await fetch("/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      if (res.status === 401) this.setToken(null);
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to fetch user");
    }
    return await res.json();
  },

  async register(name: string, phone: string, password: string): Promise<User> {
    await delay(1500);
    return {
      id: `user_${Date.now()}`,
      name,
      phone,
    };
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
