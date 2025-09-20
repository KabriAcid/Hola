// src/socket.ts
// Socket.io client singleton for Hola app
import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

class SocketService {
  private socket: Socket | null = null;
  private messageCallbacks: Array<(message: any) => void> = [];
  private statusCallbacks: Array<(update: any) => void> = [];
  private updateMessageStatusCallback:
    | ((messageId: string, status: "delivered" | "read") => void)
    | null = null;

  connect(userPhone: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
      // Register user with their phone number
      this.socket?.emit("register", userPhone);
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    // Listen for new messages
    this.socket.on("new-message", (message) => {
      console.log("New message received:", message);
      this.messageCallbacks.forEach((callback) => callback(message));

      // Auto-mark as delivered
      if (!message.is_own && message.id && this.updateMessageStatusCallback) {
        setTimeout(() => {
          this.updateMessageStatusCallback?.(
            message.id.toString(),
            "delivered"
          );
        }, 100);
      }
    });

    // Listen for message status updates
    this.socket.on("message-status-update", (update) => {
      console.log("Message status update:", update);
      this.statusCallbacks.forEach((callback) => callback(update));
    });

    // Handle call events
    this.socket.on("call-incoming", (payload) => {
      console.log("Incoming call:", payload);
      // Emit custom event for call handling
      window.dispatchEvent(
        new CustomEvent("hola-call-incoming", { detail: payload })
      );
    });

    this.socket.on("call-accepted", (payload) => {
      console.log("Call accepted:", payload);
      window.dispatchEvent(
        new CustomEvent("hola-call-accepted", { detail: payload })
      );
    });

    this.socket.on("call-declined", (payload) => {
      console.log("Call declined:", payload);
      window.dispatchEvent(
        new CustomEvent("hola-call-declined", { detail: payload })
      );
    });

    this.socket.on("call-ended", (payload) => {
      console.log("Call ended:", payload);
      window.dispatchEvent(
        new CustomEvent("hola-call-ended", { detail: payload })
      );
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.messageCallbacks = [];
    this.statusCallbacks = [];
  }

  // Message handling
  onNewMessage(callback: (message: any) => void) {
    this.messageCallbacks.push(callback);

    // Return cleanup function
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onMessageStatusUpdate(callback: (update: any) => void) {
    this.statusCallbacks.push(callback);

    // Return cleanup function
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  // Call handling
  emitCallInvite(payload: { from: string; to: string; channel: string }) {
    this.socket?.emit("call-invite", payload);
  }

  emitCallAccept(payload: { from: string; to: string; channel: string }) {
    this.socket?.emit("call-accept", payload);
  }

  emitCallDecline(payload: { from: string; to: string; channel: string }) {
    this.socket?.emit("call-decline", payload);
  }

  emitCallEnd(payload: { from: string; to: string; channel: string }) {
    this.socket?.emit("call-end", payload);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  setUpdateMessageStatusCallback(
    callback: (messageId: string, status: "delivered" | "read") => void
  ) {
    this.updateMessageStatusCallback = callback;
  }
}

export const socketService = new SocketService();

// Legacy function for backward compatibility
export function getSocket() {
  return socketService;
}
