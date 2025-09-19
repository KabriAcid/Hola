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
    try {
      window.dispatchEvent(new CustomEvent("hola-auth-changed"));
    } catch (e) {
      // ignore in non-browser environments
    }
  },

  // Persist user record (frontend-only cache)
  setUser(user: User | null) {
    if (user) {
      localStorage.setItem("hola_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("hola_user");
    }
    try {
      window.dispatchEvent(new CustomEvent("hola-auth-changed"));
    } catch (e) {
      // ignore in non-browser environments
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
    try {
      window.dispatchEvent(new CustomEvent("hola-auth-changed"));
    } catch (e) {
      // ignore in non-browser environments
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
    const token = this.getToken();
    const res = await fetch("/api/contacts", {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    if (!res.ok) throw new Error("Failed to fetch contacts");
    return await res.json();
  },

  async addContact(
    contactData: Omit<Contact, "id"> & { avatarFile?: File }
  ): Promise<Contact> {
    const token = this.getToken();
    const formData = new FormData();

    formData.append("name", contactData.name);
    formData.append("phone", contactData.phone);
    formData.append("email", contactData.email || "");
    formData.append("isFavorite", contactData.isFavorite ? "1" : "0");

    if (contactData.avatarFile) {
      formData.append("avatar", contactData.avatarFile);
    } else if (contactData.avatar) {
      formData.append("avatar", contactData.avatar);
    }

    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ error: "Failed to add contact" }));
      throw new Error(error.error || "Failed to add contact");
    }

    return await res.json();
  },

  async updateContact(
    id: string,
    updates: Partial<Contact> & { avatarFile?: File }
  ): Promise<Contact> {
    const token = this.getToken();
    const formData = new FormData();

    if (updates.name !== undefined) formData.append("name", updates.name);
    if (updates.phone !== undefined) formData.append("phone", updates.phone);
    if (updates.email !== undefined)
      formData.append("email", updates.email || "");
    if (updates.isFavorite !== undefined)
      formData.append("isFavorite", updates.isFavorite ? "1" : "0");

    if (updates.avatarFile) {
      formData.append("avatar", updates.avatarFile);
    } else if (updates.avatar !== undefined) {
      formData.append("avatar", updates.avatar);
    }

    const res = await fetch(`/api/contacts/${id}`, {
      method: "PUT",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: formData,
    });

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ error: "Failed to update contact" }));
      throw new Error(error.error || "Failed to update contact");
    }

    return await res.json();
  },

  async toggleContactFavorite(
    id: string,
    isFavorite: boolean
  ): Promise<Contact> {
    const token = this.getToken();
    const res = await fetch(`/api/contacts/${id}/favorite`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ isFavorite }),
    });

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ error: "Failed to toggle favorite" }));
      throw new Error(error.error || "Failed to toggle favorite");
    }

    return await res.json();
  },

  async deleteContact(id: string): Promise<void> {
    const token = this.getToken();
    const res = await fetch(`/api/contacts/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ error: "Failed to delete contact" }));
      throw new Error(error.error || "Failed to delete contact");
    }
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
