const express = require("express");
const { body, param } = require("express-validator");
const xss = require("xss");

const { dbGet, dbAll, dbRun, dbPaginate } = require("../database");
const {
  sendError,
  asyncHandler,
  authenticateJWT,
  validateRequest,
} = require("../middleware/auth");

// Agora token generation
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const router = express.Router();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format call log response
 */
function formatCallLogResponse(callLog) {
  if (!callLog) return null;

  return {
    id: String(callLog.id),
    contactId: callLog.contact_user_id
      ? String(callLog.contact_user_id)
      : `temp_${callLog.id}`,
    contactName: callLog.contact_name || "Unknown",
    contactPhone: callLog.contact_phone || "",
    contactAvatar: callLog.contact_avatar || "default.png",
    type: callLog.direction,
    status: callLog.status,
    duration: callLog.duration || 0,
    timestamp: callLog.started_at,
    endedAt: callLog.ended_at,
    channel: callLog.channel,
  };
}

/**
 * Determine call direction and contact info based on user ID
 */
function determineCallInfo(callLog, userId) {
  const isOutgoing = callLog.caller_id === userId;

  return {
    direction: isOutgoing ? "outgoing" : "incoming",
    contactId: isOutgoing ? callLog.receiver_id : callLog.caller_id,
    contactName: isOutgoing ? callLog.receiver_name : callLog.caller_name,
    contactPhone: isOutgoing ? callLog.receiver_phone : callLog.caller_phone,
    contactAvatar: isOutgoing ? callLog.receiver_avatar : callLog.caller_avatar,
  };
}

// ============================================================================
// CALL LOG ROUTES
// ============================================================================

/**
 * GET /api/calls
 * Get call logs for the current user with pagination and filtering
 */
router.get(
  "/",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const type = req.query.type; // 'incoming', 'outgoing', 'missed'
    const status = req.query.status; // 'answered', 'missed', 'busy', 'failed'
    const search = req.query.search?.trim();

    let whereClause = "(cl.caller_id = ? OR cl.receiver_id = ?)";
    let params = [req.user.id, req.user.id];

    // Add type filter
    if (type && ["incoming", "outgoing"].includes(type)) {
      if (type === "outgoing") {
        whereClause += " AND cl.caller_id = ?";
        params.push(req.user.id);
      } else {
        whereClause += " AND cl.receiver_id = ? AND cl.caller_id != ?";
        params.push(req.user.id, req.user.id);
      }
    }

    // Add status filter
    if (
      status &&
      ["answered", "missed", "busy", "failed", "received"].includes(status)
    ) {
      whereClause += " AND cl.status = ?";
      params.push(status);
    }

    // Add search filter (search by contact name or phone)
    if (search) {
      whereClause +=
        " AND (cl.receiver_name LIKE ? OR cl.receiver_phone LIKE ? OR caller.name LIKE ? OR caller.phone LIKE ?)";
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const baseQuery = `
    SELECT 
      cl.id,
      cl.caller_id,
      cl.receiver_id,
      cl.receiver_name,
      cl.receiver_phone,
      cl.receiver_avatar,
      cl.direction,
      cl.status,
      cl.started_at,
      cl.ended_at,
      cl.duration,
      cl.channel,
      caller.name as caller_name,
      caller.phone as caller_phone,
      caller.avatar as caller_avatar,
      receiver.name as receiver_name_from_user,
      receiver.avatar as receiver_avatar_from_user
    FROM call_logs cl
    LEFT JOIN users caller ON cl.caller_id = caller.id
    LEFT JOIN users receiver ON cl.receiver_id = receiver.id
    WHERE ${whereClause}
    ORDER BY cl.started_at DESC
  `;

    const result = await dbPaginate(baseQuery, params, page, limit);

    // Process call logs to determine direction and contact info
    const processedLogs = result.data.map((callLog) => {
      const isOutgoing = callLog.caller_id === req.user.id;

      return {
        id: String(callLog.id),
        contactId: isOutgoing
          ? callLog.receiver_id
            ? String(callLog.receiver_id)
            : `temp_${callLog.id}`
          : String(callLog.caller_id),
        contactName: isOutgoing
          ? callLog.receiver_name ||
            callLog.receiver_name_from_user ||
            "Unknown"
          : callLog.caller_name || "Unknown",
        contactPhone: isOutgoing
          ? callLog.receiver_phone || ""
          : callLog.caller_phone || "",
        contactAvatar: isOutgoing
          ? callLog.receiver_avatar ||
            callLog.receiver_avatar_from_user ||
            "default.png"
          : callLog.caller_avatar || "default.png",
        type: isOutgoing ? "outgoing" : "incoming",
        status: callLog.status,
        duration: callLog.duration || 0,
        timestamp: callLog.started_at,
        endedAt: callLog.ended_at,
        channel: callLog.channel,
      };
    });

    // Return direct array for frontend compatibility
    // Include pagination info in headers for advanced clients
    res.set({
      "X-Total-Count": result.pagination.total,
      "X-Page": result.pagination.page,
      "X-Per-Page": result.pagination.pageSize,
      "X-Total-Pages": result.pagination.totalPages,
    });

    res.json(processedLogs);
  })
);

/**
 * GET /api/calls/:id
 * Get a specific call log
 */
router.get(
  "/:id",
  authenticateJWT,
  [param("id").isInt({ min: 1 }).withMessage("Invalid call log ID")],
  validateRequest,
  asyncHandler(async (req, res) => {
    const callLogId = req.params.id;

    const callLog = await dbGet(
      `
    SELECT 
      cl.*,
      caller.name as caller_name,
      caller.phone as caller_phone,
      caller.avatar as caller_avatar,
      receiver.name as receiver_name_from_user,
      receiver.avatar as receiver_avatar_from_user
    FROM call_logs cl
    LEFT JOIN users caller ON cl.caller_id = caller.id
    LEFT JOIN users receiver ON cl.receiver_id = receiver.id
    WHERE cl.id = ? AND (cl.caller_id = ? OR cl.receiver_id = ?)
  `,
      [callLogId, req.user.id, req.user.id]
    );

    if (!callLog) {
      return sendError(res, 404, "Call log not found");
    }

    const isOutgoing = callLog.caller_id === req.user.id;

    const formattedCallLog = {
      id: String(callLog.id),
      contactId: isOutgoing
        ? callLog.receiver_id
          ? String(callLog.receiver_id)
          : `temp_${callLog.id}`
        : String(callLog.caller_id),
      contactName: isOutgoing
        ? callLog.receiver_name || callLog.receiver_name_from_user || "Unknown"
        : callLog.caller_name || "Unknown",
      contactPhone: isOutgoing
        ? callLog.receiver_phone || ""
        : callLog.caller_phone || "",
      contactAvatar: isOutgoing
        ? callLog.receiver_avatar ||
          callLog.receiver_avatar_from_user ||
          "default.png"
        : callLog.caller_avatar || "default.png",
      type: isOutgoing ? "outgoing" : "incoming",
      status: callLog.status,
      duration: callLog.duration || 0,
      timestamp: callLog.started_at,
      endedAt: callLog.ended_at,
      channel: callLog.channel,
    };

    res.json(formattedCallLog);
  })
);

/**
 * POST /api/calls
 * Create a new call log entry
 */
router.post(
  "/",
  authenticateJWT,
  [
    body("calleePhone")
      .trim()
      .notEmpty()
      .withMessage("Callee phone number is required")
      .isMobilePhone("en-NG")
      .withMessage("Invalid Nigerian phone number"),
    body("calleeName")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Callee name must be max 100 characters"),
    body("direction")
      .optional()
      .isIn(["incoming", "outgoing"])
      .withMessage("Direction must be incoming or outgoing"),
    body("channel")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Channel must be max 100 characters"),
    body("status")
      .optional()
      .isIn(["answered", "missed", "busy", "failed", "received"])
      .withMessage("Invalid call status"),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const calleePhone = xss(req.body.calleePhone.trim());
    const calleeName = req.body.calleeName
      ? xss(req.body.calleeName.trim())
      : "Unknown";
    const direction = req.body.direction || "outgoing";
    const channel = req.body.channel ? xss(req.body.channel.trim()) : null;
    const status = req.body.status || "received";

    // Find receiver user by phone
    const receiverUser = await dbGet(
      "SELECT id, name, avatar FROM users WHERE phone = ? AND is_verified = TRUE",
      [calleePhone]
    );

    let receiverId = null;
    let receiverName = calleeName;
    let receiverAvatar = "default.png";

    if (receiverUser) {
      receiverId = receiverUser.id;
      receiverName = receiverUser.name || calleeName;
      receiverAvatar = receiverUser.avatar || "default.png";
    }

    // Insert call log
    const result = await dbRun(
      `
    INSERT INTO call_logs (
      caller_id, receiver_id, receiver_name, receiver_phone, receiver_avatar,
      direction, status, channel, started_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `,
      [
        req.user.id,
        receiverId,
        receiverName,
        calleePhone,
        receiverAvatar,
        direction,
        status,
        channel,
      ]
    );

    // Get the created call log
    const callLog = await dbGet("SELECT * FROM call_logs WHERE id = ?", [
      result.insertId,
    ]);

    res.status(201).json({
      message: "Call log created successfully",
      callLog: {
        id: String(callLog.id),
        contactId: receiverId ? String(receiverId) : `temp_${callLog.id}`,
        contactName: receiverName,
        contactPhone: calleePhone,
        contactAvatar: receiverAvatar,
        type: direction,
        status: status,
        duration: 0,
        timestamp: callLog.started_at,
        channel: channel,
      },
    });
  })
);

/**
 * PUT /api/calls/:id
 * Update a call log (mainly to end a call and set duration)
 */
router.put(
  "/:id",
  authenticateJWT,
  [
    param("id").isInt({ min: 1 }).withMessage("Invalid call log ID"),
    body("status")
      .optional()
      .isIn(["answered", "missed", "busy", "failed", "ended"])
      .withMessage("Invalid call status"),
    body("duration")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Duration must be a positive integer"),
    body("endedAt")
      .optional()
      .isISO8601()
      .withMessage("Invalid end time format"),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const callLogId = req.params.id;

    // Check if call log exists and belongs to user
    const callLog = await dbGet(
      "SELECT * FROM call_logs WHERE id = ? AND (caller_id = ? OR receiver_id = ?)",
      [callLogId, req.user.id, req.user.id]
    );

    if (!callLog) {
      return sendError(res, 404, "Call log not found");
    }

    // Build update object
    const updates = {};

    if (req.body.status) {
      updates.status = req.body.status;
    }

    if (req.body.duration !== undefined) {
      updates.duration = req.body.duration;
    }

    if (req.body.endedAt) {
      updates.ended_at = new Date(req.body.endedAt);
    } else if (req.body.status === "ended" && !callLog.ended_at) {
      updates.ended_at = new Date();
    }

    if (Object.keys(updates).length === 0) {
      return sendError(res, 400, "No valid fields to update");
    }

    // Build and execute update query
    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(updates);

    await dbRun(`UPDATE call_logs SET ${setClause} WHERE id = ?`, [
      ...values,
      callLogId,
    ]);

    // Get updated call log
    const updatedCallLog = await dbGet("SELECT * FROM call_logs WHERE id = ?", [
      callLogId,
    ]);

    const isOutgoing = updatedCallLog.caller_id === req.user.id;

    res.json({
      message: "Call log updated successfully",
      callLog: {
        id: String(updatedCallLog.id),
        contactId: isOutgoing
          ? updatedCallLog.receiver_id
            ? String(updatedCallLog.receiver_id)
            : `temp_${updatedCallLog.id}`
          : String(updatedCallLog.caller_id),
        contactName: isOutgoing ? updatedCallLog.receiver_name : "Unknown",
        contactPhone: isOutgoing ? updatedCallLog.receiver_phone : "",
        contactAvatar: isOutgoing
          ? updatedCallLog.receiver_avatar
          : "default.png",
        type: isOutgoing ? "outgoing" : "incoming",
        status: updatedCallLog.status,
        duration: updatedCallLog.duration || 0,
        timestamp: updatedCallLog.started_at,
        endedAt: updatedCallLog.ended_at,
        channel: updatedCallLog.channel,
      },
    });
  })
);

/**
 * DELETE /api/calls/:id
 * Delete a call log
 */
router.delete(
  "/:id",
  authenticateJWT,
  [param("id").isInt({ min: 1 }).withMessage("Invalid call log ID")],
  validateRequest,
  asyncHandler(async (req, res) => {
    const callLogId = req.params.id;

    // Check if call log exists and belongs to user
    const exists = await dbGet(
      "SELECT 1 FROM call_logs WHERE id = ? AND (caller_id = ? OR receiver_id = ?)",
      [callLogId, req.user.id, req.user.id]
    );

    if (!exists) {
      return sendError(res, 404, "Call log not found");
    }

    // Delete call log
    await dbRun("DELETE FROM call_logs WHERE id = ?", [callLogId]);

    res.json({ message: "Call log deleted successfully" });
  })
);

/**
 * GET /api/calls/stats
 * Get call statistics for the user
 */
router.get(
  "/stats",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const timeframe = req.query.timeframe || "30"; // days
    const days = Math.min(parseInt(timeframe), 365);

    const stats = await dbGet(
      `
    SELECT 
      COUNT(*) as total_calls,
      COUNT(CASE WHEN status = 'answered' THEN 1 END) as answered_calls,
      COUNT(CASE WHEN status = 'missed' THEN 1 END) as missed_calls,
      COUNT(CASE WHEN caller_id = ? THEN 1 END) as outgoing_calls,
      COUNT(CASE WHEN receiver_id = ? AND caller_id != ? THEN 1 END) as incoming_calls,
      AVG(CASE WHEN duration > 0 THEN duration END) as avg_duration,
      SUM(CASE WHEN duration > 0 THEN duration END) as total_duration
    FROM call_logs 
    WHERE (caller_id = ? OR receiver_id = ?) 
      AND started_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
  `,
      [req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, days]
    );

    res.json({
      timeframe: `${days} days`,
      stats: {
        totalCalls: stats.total_calls || 0,
        answeredCalls: stats.answered_calls || 0,
        missedCalls: stats.missed_calls || 0,
        outgoingCalls: stats.outgoing_calls || 0,
        incomingCalls: stats.incoming_calls || 0,
        averageDuration: Math.round(stats.avg_duration || 0),
        totalDuration: stats.total_duration || 0,
      },
    });
  })
);

// ============================================================================
// AGORA TOKEN GENERATION
// ============================================================================

/**
 * GET /api/agora-token
 * Generate Agora RTC token for voice calls
 */
router.get(
  "/agora-token",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const { channel, uid } = req.query;

    console.log(
      `[AGORA] Token request - Channel: ${channel}, UID: ${uid}, User: ${req.user?.phone}`
    );

    if (!channel || !uid) {
      return sendError(res, 400, "Channel and UID are required");
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      console.error("Missing Agora credentials:", {
        appId: !!appId,
        appCertificate: !!appCertificate,
      });
      return sendError(res, 500, "Agora service not configured");
    }

    try {
      const role = RtcRole.PUBLISHER;
      const expirationTimeInSeconds = 3600; // 1 hour
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

      // Generate token
      const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channel,
        parseInt(uid) || 0,
        role,
        privilegeExpiredTs
      );

      console.log(
        `[AGORA] Token generated for channel: ${channel}, uid: ${uid}`
      );

      res.json({
        token,
        appId,
        channel,
        uid,
        expiresAt: privilegeExpiredTs,
        role: "publisher",
      });
    } catch (error) {
      console.error("Agora token generation error:", error);
      return sendError(res, 500, "Failed to generate Agora token");
    }
  })
);

module.exports = router;
