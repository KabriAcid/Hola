const express = require("express");
const { body, param } = require("express-validator");
const xss = require("xss");

const { dbGet, dbAll, dbRun, dbTransaction, dbExists } = require("../database");
const {
  sendError,
  asyncHandler,
  authenticateJWT,
  validateRequest,
} = require("../middleware/auth");

const router = express.Router();

// We'll need access to Socket.IO for real-time messaging
// This will be injected from the main app
let io = null;
function setSocketIO(socketIO) {
  io = socketIO;
}

// In-memory map for user sockets (should match the one in socket middleware)
const userSockets = {};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format message response
 */
function formatMessageResponse(message, currentUserId) {
  if (!message) return null;

  return {
    id: message.id,
    conversationId: message.conversation_id,
    content: message.content,
    messageType: message.message_type,
    fileUrl: message.file_url,
    fileSize: message.file_size,
    fileName: message.file_name,
    replyToMessageId: message.reply_to_message_id,
    isOwn: message.sender_id === currentUserId,
    createdAt: message.created_at,
    editedAt: message.edited_at,
    sender: {
      id: message.sender_id,
      name: message.sender_name,
      avatar: message.sender_avatar,
    },
    status: message.status || [],
  };
}

/**
 * Format conversation response
 */
function formatConversationResponse(conversation, currentUserId) {
  if (!conversation) return null;

  return {
    id: conversation.id,
    type: conversation.type,
    name: conversation.name,
    avatar: conversation.avatar,
    createdBy: conversation.created_by,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
    lastMessageAt: conversation.last_message_at,
    // Other participant info for direct chats
    ...(conversation.other_user_name && {
      otherParticipant: {
        name: conversation.other_user_name,
        avatar: conversation.other_user_avatar,
        status: conversation.other_user_status,
        lastSeen: conversation.other_user_last_seen,
      },
    }),
    lastMessage: conversation.last_message_content
      ? {
          content: conversation.last_message_content,
          senderName: conversation.last_message_sender_name,
          createdAt: conversation.last_message_created_at,
          isOwn: conversation.last_message_sender_id === currentUserId,
        }
      : null,
  };
}

/**
 * Broadcast message to conversation participants
 */
async function broadcastToConversation(
  conversationId,
  event,
  data,
  excludeUserId = null
) {
  if (!io) return;

  try {
    // Get conversation participants
    const participants = await dbAll(
      `
      SELECT u.phone 
      FROM conversation_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.conversation_id = ? ${excludeUserId ? "AND cp.user_id != ?" : ""}
    `,
      excludeUserId ? [conversationId, excludeUserId] : [conversationId]
    );

    // Send to each participant's socket
    participants.forEach((participant) => {
      const socketId = userSockets[participant.phone];
      if (socketId) {
        io.to(socketId).emit(event, data);
      }
    });
  } catch (error) {
    console.error("[MESSAGES] Broadcast error:", error);
  }
}

// ============================================================================
// CONVERSATION ROUTES
// ============================================================================

/**
 * GET /api/messages/conversations
 * Get all conversations for the current user
 */
router.get(
  "/conversations",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    const conversations = await dbAll(
      `
    SELECT DISTINCT 
      c.*,
      -- Other participant info for direct chats
      CASE 
        WHEN c.type = 'direct' THEN other_user.name
        ELSE c.name
      END as display_name,
      CASE 
        WHEN c.type = 'direct' THEN other_user.avatar
        ELSE c.avatar
      END as display_avatar,
      other_user.name as other_user_name,
      other_user.avatar as other_user_avatar,
      other_user.status as other_user_status,
      other_user.last_seen as other_user_last_seen,
      -- Last message info
      last_msg.content as last_message_content,
      last_msg.created_at as last_message_created_at,
      last_msg.sender_id as last_message_sender_id,
      last_sender.name as last_message_sender_name
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    -- Get other participant for direct chats
    LEFT JOIN conversation_participants other_cp ON c.id = other_cp.conversation_id 
      AND other_cp.user_id != ? AND c.type = 'direct'
    LEFT JOIN users other_user ON other_cp.user_id = other_user.id
    -- Get last message
    LEFT JOIN messages last_msg ON c.id = last_msg.conversation_id
      AND last_msg.created_at = (
        SELECT MAX(created_at) FROM messages 
        WHERE conversation_id = c.id AND deleted_at IS NULL
      )
    LEFT JOIN users last_sender ON last_msg.sender_id = last_sender.id
    WHERE cp.user_id = ?
    ORDER BY c.last_message_at DESC
    LIMIT ? OFFSET ?
  `,
      [req.user.id, req.user.id, limit, offset]
    );

    const formattedConversations = conversations.map((conv) =>
      formatConversationResponse(conv, req.user.id)
    );

    res.json({
      conversations: formattedConversations,
      pagination: {
        limit,
        offset,
        count: formattedConversations.length,
      },
    });
  })
);

/**
 * POST /api/messages/conversations
 * Create or get a direct conversation
 */
router.post(
  "/conversations",
  authenticateJWT,
  [
    body("type")
      .optional()
      .isIn(["direct", "group"])
      .withMessage("Type must be direct or group"),
    body("participantIds")
      .isArray({ min: 1, max: 1 })
      .withMessage("Must provide exactly one participant ID for direct chat"),
    body("participantIds.*")
      .isInt({ min: 1 })
      .withMessage("Participant ID must be a positive integer"),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const type = req.body.type || "direct";
    const participantIds = req.body.participantIds;

    if (type === "direct" && participantIds.length === 1) {
      const otherUserId = participantIds[0];

      // Check if other user exists and is verified
      const otherUser = await dbGet(
        "SELECT id, name, avatar FROM users WHERE id = ? AND is_verified = TRUE",
        [otherUserId]
      );

      if (!otherUser) {
        return sendError(res, 404, "User not found");
      }

      // Check if conversation already exists
      const existingConversation = await dbGet(
        `
      SELECT c.id FROM conversations c
      JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
      JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
      WHERE c.type = 'direct' 
        AND cp1.user_id = ? 
        AND cp2.user_id = ?
    `,
        [req.user.id, otherUserId]
      );

      if (existingConversation) {
        // Return existing conversation
        const conversation = await dbGet(
          `
        SELECT c.*, u.name as other_user_name, u.avatar as other_user_avatar,
               u.status as other_user_status, u.last_seen as other_user_last_seen
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        JOIN users u ON cp.user_id = u.id
        WHERE c.id = ? AND cp.user_id = ?
      `,
          [existingConversation.id, otherUserId]
        );

        return res.json(formatConversationResponse(conversation, req.user.id));
      }

      // Create new conversation in transaction
      const result = await dbTransaction(async (connection) => {
        // Create conversation
        const [convResult] = await connection.execute(
          "INSERT INTO conversations (type, created_by) VALUES (?, ?)",
          [type, req.user.id]
        );

        const conversationId = convResult.insertId;

        // Add participants
        await connection.execute(
          "INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)",
          [conversationId, req.user.id]
        );

        await connection.execute(
          "INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)",
          [conversationId, otherUserId]
        );

        return conversationId;
      });

      // Get the created conversation with participant info
      const conversation = await dbGet(
        `
      SELECT c.*, u.name as other_user_name, u.avatar as other_user_avatar,
             u.status as other_user_status, u.last_seen as other_user_last_seen
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      JOIN users u ON cp.user_id = u.id
      WHERE c.id = ? AND cp.user_id = ?
    `,
        [result, otherUserId]
      );

      res.status(201).json({
        message: "Conversation created successfully",
        conversation: formatConversationResponse(conversation, req.user.id),
      });
    } else {
      return sendError(
        res,
        400,
        "Only direct conversations are currently supported"
      );
    }
  })
);

/**
 * GET /api/messages/conversations/:id
 * Get conversation details
 */
router.get(
  "/conversations/:id",
  authenticateJWT,
  [param("id").isInt({ min: 1 }).withMessage("Invalid conversation ID")],
  validateRequest,
  asyncHandler(async (req, res) => {
    const conversationId = req.params.id;

    // Check if user is participant
    const isParticipant = await dbExists(
      "SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?",
      [conversationId, req.user.id]
    );

    if (!isParticipant) {
      return sendError(res, 403, "Not a participant in this conversation");
    }

    // Get conversation with other participant info
    const conversation = await dbGet(
      `
    SELECT c.*, 
           other_user.name as other_user_name, 
           other_user.avatar as other_user_avatar,
           other_user.status as other_user_status, 
           other_user.last_seen as other_user_last_seen
    FROM conversations c
    LEFT JOIN conversation_participants other_cp ON c.id = other_cp.conversation_id 
      AND other_cp.user_id != ? AND c.type = 'direct'
    LEFT JOIN users other_user ON other_cp.user_id = other_user.id
    WHERE c.id = ?
  `,
      [req.user.id, conversationId]
    );

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    res.json(formatConversationResponse(conversation, req.user.id));
  })
);

// ============================================================================
// MESSAGE ROUTES
// ============================================================================

/**
 * GET /api/messages/conversations/:id/messages
 * Get messages in a conversation
 */
router.get(
  "/conversations/:id/messages",
  authenticateJWT,
  [param("id").isInt({ min: 1 }).withMessage("Invalid conversation ID")],
  validateRequest,
  asyncHandler(async (req, res) => {
    const conversationId = req.params.id;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    // Check if user is participant
    const isParticipant = await dbExists(
      "SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?",
      [conversationId, req.user.id]
    );

    if (!isParticipant) {
      return sendError(res, 403, "Not a participant in this conversation");
    }

    // Get messages with status info
    const messages = await dbAll(
      `
    SELECT 
      m.*,
      u.name as sender_name,
      u.avatar as sender_avatar,
      GROUP_CONCAT(
        CONCAT(ms.user_id, ':', ms.status, ':', ms.timestamp)
        ORDER BY ms.timestamp DESC
      ) as status_info
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    LEFT JOIN message_status ms ON m.id = ms.message_id
    WHERE m.conversation_id = ? AND m.deleted_at IS NULL
    GROUP BY m.id
    ORDER BY m.created_at DESC
    LIMIT ? OFFSET ?
  `,
      [conversationId, limit, offset]
    );

    // Process messages and parse status
    const processedMessages = messages
      .map((message) => {
        // Parse status info
        let status = [];
        if (message.status_info) {
          status = message.status_info.split(",").map((statusStr) => {
            const [userId, statusType, timestamp] = statusStr.split(":");
            return {
              userId: parseInt(userId),
              status: statusType,
              timestamp,
            };
          });
        }

        return {
          ...formatMessageResponse(message, req.user.id),
          status,
        };
      })
      .reverse(); // Return in chronological order

    res.json({
      messages: processedMessages,
      pagination: {
        limit,
        offset,
        count: processedMessages.length,
      },
    });
  })
);

/**
 * POST /api/messages/conversations/:id/messages
 * Send a message in a conversation
 */
router.post(
  "/conversations/:id/messages",
  authenticateJWT,
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid conversation ID"),
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Message content is required")
      .isLength({ max: 4000 })
      .withMessage("Message content must be max 4000 characters"),
    body("messageType")
      .optional()
      .isIn(["text", "image", "audio", "video", "file"])
      .withMessage("Invalid message type"),
    body("replyToMessageId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Invalid reply message ID"),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const conversationId = req.params.id;
    const content = xss(req.body.content.trim());
    const messageType = req.body.messageType || "text";
    const replyToMessageId = req.body.replyToMessageId || null;

    // Check if user is participant
    const isParticipant = await dbExists(
      "SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?",
      [conversationId, req.user.id]
    );

    if (!isParticipant) {
      return sendError(res, 403, "Not a participant in this conversation");
    }

    // Validate reply message if provided
    if (replyToMessageId) {
      const replyMessage = await dbExists(
        "SELECT 1 FROM messages WHERE id = ? AND conversation_id = ?",
        [replyToMessageId, conversationId]
      );

      if (!replyMessage) {
        return sendError(
          res,
          400,
          "Reply message not found in this conversation"
        );
      }
    }

    const result = await dbTransaction(async (connection) => {
      // Insert message
      const [messageResult] = await connection.execute(
        `
      INSERT INTO messages (conversation_id, sender_id, content, message_type, reply_to_message_id)
      VALUES (?, ?, ?, ?, ?)
    `,
        [conversationId, req.user.id, content, messageType, replyToMessageId]
      );

      const messageId = messageResult.insertId;

      // Create initial status as "sent"
      await connection.execute(
        "INSERT INTO message_status (message_id, user_id, status) VALUES (?, ?, 'sent')",
        [messageId, req.user.id]
      );

      // Update conversation last_message_at
      await connection.execute(
        "UPDATE conversations SET last_message_at = NOW() WHERE id = ?",
        [conversationId]
      );

      return messageId;
    });

    // Get the created message with sender info
    const message = await dbGet(
      `
    SELECT 
      m.*,
      u.name as sender_name,
      u.avatar as sender_avatar
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.id = ?
  `,
      [result]
    );

    const formattedMessage = {
      ...formatMessageResponse(message, req.user.id),
      status: [
        { userId: req.user.id, status: "sent", timestamp: message.created_at },
      ],
    };

    // Broadcast to other participants
    await broadcastToConversation(
      conversationId,
      "new-message",
      {
        ...formattedMessage,
        isOwn: false,
      },
      req.user.id
    );

    res.status(201).json({
      message: "Message sent successfully",
      data: formattedMessage,
    });
  })
);

/**
 * PUT /api/messages/:messageId/status
 * Update message status (delivered, read)
 */
router.put(
  "/:messageId/status",
  authenticateJWT,
  [
    param("messageId").isInt({ min: 1 }).withMessage("Invalid message ID"),
    body("status")
      .isIn(["delivered", "read"])
      .withMessage("Status must be delivered or read"),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const messageId = req.params.messageId;
    const status = req.body.status;

    // Get message and verify user is participant
    const message = await dbGet(
      `
    SELECT m.*, cp.user_id as participant_id
    FROM messages m
    JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
    WHERE m.id = ? AND cp.user_id = ?
  `,
      [messageId, req.user.id]
    );

    if (!message) {
      return sendError(res, 404, "Message not found or not authorized");
    }

    // Don't update status for own messages
    if (message.sender_id === req.user.id) {
      return sendError(res, 400, "Cannot update status of own message");
    }

    // Insert or update status
    await dbRun(
      `
    INSERT INTO message_status (message_id, user_id, status) 
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE status = ?, timestamp = NOW()
  `,
      [messageId, req.user.id, status, status]
    );

    // Get sender info to notify them
    const sender = await dbGet(
      "SELECT u.phone FROM users u JOIN messages m ON u.id = m.sender_id WHERE m.id = ?",
      [messageId]
    );

    // Notify sender via Socket.IO
    if (sender && io) {
      const socketId = userSockets[sender.phone];
      if (socketId) {
        io.to(socketId).emit("message-status-update", {
          messageId: parseInt(messageId),
          userId: req.user.id,
          status,
          timestamp: new Date().toISOString(),
        });
      }
    }

    res.json({
      message: "Message status updated successfully",
      status,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * PUT /api/messages/:messageId
 * Edit a message
 */
router.put(
  "/:messageId",
  authenticateJWT,
  [
    param("messageId").isInt({ min: 1 }).withMessage("Invalid message ID"),
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Message content is required")
      .isLength({ max: 4000 })
      .withMessage("Message content must be max 4000 characters"),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const messageId = req.params.messageId;
    const content = xss(req.body.content.trim());

    // Check if message exists and belongs to user
    const message = await dbGet(
      "SELECT * FROM messages WHERE id = ? AND sender_id = ? AND deleted_at IS NULL",
      [messageId, req.user.id]
    );

    if (!message) {
      return sendError(res, 404, "Message not found or not authorized");
    }

    // Update message
    await dbRun(
      "UPDATE messages SET content = ?, edited_at = NOW() WHERE id = ?",
      [content, messageId]
    );

    // Get updated message
    const updatedMessage = await dbGet(
      `
    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar
    FROM messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.id = ?
  `,
      [messageId]
    );

    const formattedMessage = formatMessageResponse(updatedMessage, req.user.id);

    // Broadcast update to conversation participants
    await broadcastToConversation(
      message.conversation_id,
      "message-updated",
      formattedMessage
    );

    res.json({
      message: "Message updated successfully",
      data: formattedMessage,
    });
  })
);

/**
 * DELETE /api/messages/:messageId
 * Delete a message (soft delete)
 */
router.delete(
  "/:messageId",
  authenticateJWT,
  [param("messageId").isInt({ min: 1 }).withMessage("Invalid message ID")],
  validateRequest,
  asyncHandler(async (req, res) => {
    const messageId = req.params.messageId;

    // Check if message exists and belongs to user
    const message = await dbGet(
      "SELECT * FROM messages WHERE id = ? AND sender_id = ? AND deleted_at IS NULL",
      [messageId, req.user.id]
    );

    if (!message) {
      return sendError(res, 404, "Message not found or not authorized");
    }

    // Soft delete message
    await dbRun("UPDATE messages SET deleted_at = NOW() WHERE id = ?", [
      messageId,
    ]);

    // Broadcast deletion to conversation participants
    await broadcastToConversation(message.conversation_id, "message-deleted", {
      messageId: parseInt(messageId),
      conversationId: message.conversation_id,
    });

    res.json({ message: "Message deleted successfully" });
  })
);

module.exports = { router, setSocketIO };
