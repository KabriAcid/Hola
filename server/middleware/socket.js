/**
 * Socket.IO Event Handler
 * Manages real-time communication for calls and messages
 */

// In-memory map: phone number -> socket.id
const userSockets = {};

function socketHandler(io) {
  io.on("connection", (socket) => {
    // Only log in development for debugging
    if (process.env.NODE_ENV === "development") {
      console.log(`[SOCKET] New connection: ${socket.id}`);
    }

    // ========================================
    // USER REGISTRATION
    // ========================================

    socket.on("register", (phone) => {
      if (!phone) {
        socket.emit("error", {
          message: "Phone number required for registration",
        });
        return;
      }

      // Remove old mapping if exists
      Object.keys(userSockets).forEach((key) => {
        if (userSockets[key] === socket.id) {
          delete userSockets[key];
        }
      });

      userSockets[phone] = socket.id;
      socket.phone = phone;

      console.log(`[SOCKET] User registered: ${phone} -> ${socket.id}`);
      socket.emit("registered", { phone, socketId: socket.id });

      // Notify about online status
      socket.broadcast.emit("user-online", { phone });
    });

    // ========================================
    // VOICE CALL HANDLING
    // ========================================

    socket.on("call-invite", (payload) => {
      const { to, from, channel, callerName } = payload;

      if (!to || !from || !channel) {
        socket.emit("error", { message: "Missing required call parameters" });
        return;
      }

      const targetSocketId = userSockets[to];
      if (targetSocketId) {
        io.to(targetSocketId).emit("call-incoming", {
          from,
          to,
          channel,
          callerName: callerName || "Unknown Caller",
          timestamp: new Date().toISOString(),
        });
        console.log(`[SOCKET] Call invite sent: ${from} -> ${to} (${channel})`);
      } else {
        socket.emit("call-failed", {
          reason: "User not available",
          to,
        });
      }
    });

    socket.on("call-accept", (payload) => {
      const { to, from, channel } = payload;
      const targetSocketId = userSockets[to];

      if (targetSocketId) {
        io.to(targetSocketId).emit("call-accepted", {
          from,
          to,
          channel,
          timestamp: new Date().toISOString(),
        });
        console.log(`[SOCKET] Call accepted: ${from} <-> ${to}`);
      }
    });

    socket.on("call-decline", (payload) => {
      const { to, from, channel, reason } = payload;
      const targetSocketId = userSockets[to];

      if (targetSocketId) {
        io.to(targetSocketId).emit("call-declined", {
          from,
          to,
          channel,
          reason: reason || "Call declined",
          timestamp: new Date().toISOString(),
        });
        console.log(`[SOCKET] Call declined: ${from} -> ${to}`);
      }
    });

    socket.on("call-end", (payload) => {
      const { to, from, channel, duration } = payload;
      const targetSocketId = userSockets[to];

      if (targetSocketId) {
        io.to(targetSocketId).emit("call-ended", {
          from,
          to,
          channel,
          duration: duration || 0,
          timestamp: new Date().toISOString(),
        });
        console.log(`[SOCKET] Call ended: ${from} <-> ${to} (${duration}s)`);
      }
    });

    // ========================================
    // MESSAGING HANDLING
    // ========================================

    socket.on("join-conversation", (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(
        `[SOCKET] ${socket.phone} joined conversation ${conversationId}`
      );
    });

    socket.on("leave-conversation", (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(
        `[SOCKET] ${socket.phone} left conversation ${conversationId}`
      );
    });

    socket.on("typing-start", (payload) => {
      const { conversationId, userName } = payload;
      socket.to(`conversation_${conversationId}`).emit("user-typing", {
        conversationId,
        userName: userName || socket.phone,
        isTyping: true,
      });
    });

    socket.on("typing-stop", (payload) => {
      const { conversationId, userName } = payload;
      socket.to(`conversation_${conversationId}`).emit("user-typing", {
        conversationId,
        userName: userName || socket.phone,
        isTyping: false,
      });
    });

    // ========================================
    // PRESENCE HANDLING
    // ========================================

    socket.on("status-update", (status) => {
      if (!socket.phone) return;

      // Broadcast status update to contacts
      socket.broadcast.emit("user-status-change", {
        phone: socket.phone,
        status,
        timestamp: new Date().toISOString(),
      });

      console.log(`[SOCKET] Status update: ${socket.phone} -> ${status}`);
    });

    // ========================================
    // DISCONNECTION HANDLING
    // ========================================

    socket.on("disconnect", (reason) => {
      if (socket.phone && userSockets[socket.phone] === socket.id) {
        delete userSockets[socket.phone];

        // Notify about offline status
        socket.broadcast.emit("user-offline", {
          phone: socket.phone,
          timestamp: new Date().toISOString(),
        });

        console.log(`[SOCKET] User disconnected: ${socket.phone} (${reason})`);
      }
    });

    // ========================================
    // ERROR HANDLING
    // ========================================

    socket.on("error", (error) => {
      console.error(`[SOCKET] Error from ${socket.id}:`, error);
    });
  });

  return {
    getUserSocket: (phone) => userSockets[phone],
    getOnlineUsers: () => Object.keys(userSockets),
    broadcastToUser: (phone, event, data) => {
      const socketId = userSockets[phone];
      if (socketId) {
        io.to(socketId).emit(event, data);
        return true;
      }
      return false;
    },
    broadcastToConversation: (conversationId, event, data) => {
      io.to(`conversation_${conversationId}`).emit(event, data);
    },
  };
}

module.exports = { socketHandler };
