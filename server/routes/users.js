const express = require("express");
const { body, param } = require("express-validator");
const xss = require("xss");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const { dbGet, dbAll, dbRun } = require("../database");
const {
  sendError,
  asyncHandler,
  authenticateJWT,
  validateRequest,
} = require("../middleware/auth");

const router = express.Router();

// User fields for consistent response
const USER_FIELDS = [
  "id",
  "phone",
  "name",
  "username",
  "avatar",
  "bio",
  "country",
  "is_verified",
  "status",
  "last_seen",
  "custom_status",
  "created_at",
];

/**
 * Helper function to format user response
 */
function formatUserResponse(user) {
  if (!user) return null;

  const result = {};
  USER_FIELDS.forEach((field) => {
    if (user[field] !== undefined) {
      result[field] = user[field];
    }
  });
  return result;
}

// ============================================================================
// USER ROUTES
// ============================================================================

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get(
  "/me",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const user = await dbGet(
      `SELECT ${USER_FIELDS.join(", ")} FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    res.json(formatUserResponse(user));
  })
);

/**
 * GET /api/users/username/:username
 * Get user by username
 */
router.get(
  "/username/:username",
  [
    param("username")
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be 3-30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Invalid username format"),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const username = xss(req.params.username.trim());

    const user = await dbGet(
      `SELECT ${USER_FIELDS.join(
        ", "
      )} FROM users WHERE username = ? AND is_verified = TRUE`,
      [username]
    );

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    res.json(formatUserResponse(user));
  })
);

/**
 * GET /api/users/phone/:phone
 * Get user by phone number (protected route)
 */
router.get(
  "/phone/:phone",
  authenticateJWT,
  [
    param("phone")
      .trim()
      .isMobilePhone("en-NG")
      .withMessage("Invalid phone number"),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const phone = xss(req.params.phone.trim());

    const user = await dbGet(
      `SELECT ${USER_FIELDS.join(
        ", "
      )} FROM users WHERE phone = ? AND is_verified = TRUE`,
      [phone]
    );

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    res.json(formatUserResponse(user));
  })
);

/**
 * PUT /api/users/me
 * Update current user profile
 */
router.put(
  "/me",
  authenticateJWT,
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Name must be 1-100 characters"),
    body("bio")
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage("Bio must be max 200 characters"),
    body("custom_status")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Custom status must be max 100 characters"),
    body("country")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Country must be 2-50 characters"),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const allowedFields = ["name", "bio", "custom_status", "country"];
    const updateData = {};

    // Build update object with only allowed fields
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = xss(req.body[field].trim());
      }
    });

    if (Object.keys(updateData).length === 0) {
      return sendError(res, 400, "No valid fields to update");
    }

    // Build dynamic update query
    const setClause = Object.keys(updateData)
      .map((field) => `${field} = ?`)
      .join(", ");
    const values = Object.values(updateData);

    await dbRun(`UPDATE users SET ${setClause} WHERE id = ?`, [
      ...values,
      req.user.id,
    ]);

    // Get updated user
    const updatedUser = await dbGet(
      `SELECT ${USER_FIELDS.join(", ")} FROM users WHERE id = ?`,
      [req.user.id]
    );

    res.json({
      message: "Profile updated successfully",
      user: formatUserResponse(updatedUser),
    });
  })
);

/**
 * PUT /api/users/me/status
 * Update user online status
 */
router.put(
  "/me/status",
  authenticateJWT,
  [
    body("status")
      .isIn(["online", "offline", "away", "busy"])
      .withMessage("Status must be one of: online, offline, away, busy"),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const status = req.body.status;

    await dbRun("UPDATE users SET status = ?, last_seen = NOW() WHERE id = ?", [
      status,
      req.user.id,
    ]);

    res.json({
      message: "Status updated successfully",
      status,
      timestamp: new Date().toISOString(),
    });
  })
);

/**
 * GET /api/users/search
 * Search users by name, username, or phone
 */
router.get(
  "/search",
  authenticateJWT,
  [
    body("q")
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Search query must be 1-50 characters"),
  ],
  asyncHandler(async (req, res) => {
    const query = xss(req.query.q?.trim() || "");
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    if (!query) {
      return sendError(res, 400, "Search query is required");
    }

    const searchPattern = `%${query}%`;

    const users = await dbAll(
      `
    SELECT ${USER_FIELDS.join(", ")}
    FROM users 
    WHERE is_verified = TRUE 
      AND id != ?
      AND (
        name LIKE ? OR 
        username LIKE ? OR 
        phone LIKE ?
      )
    ORDER BY 
      CASE 
        WHEN name LIKE ? THEN 1
        WHEN username LIKE ? THEN 2
        ELSE 3
      END,
      name ASC
    LIMIT ? OFFSET ?
  `,
      [
        req.user.id,
        searchPattern,
        searchPattern,
        searchPattern,
        `${query}%`,
        `${query}%`,
        limit,
        offset,
      ]
    );

    const formattedUsers = users.map(formatUserResponse);

    res.json({
      users: formattedUsers,
      query,
      pagination: {
        limit,
        offset,
        count: formattedUsers.length,
      },
    });
  })
);

// ============================================================================
// AGORA TOKEN GENERATION
// ============================================================================

/**
 * GET /api/users/agora-token
 * Generate Agora RTC token for voice calls
 */
router.get(
  "/agora-token",
  authenticateJWT,
  asyncHandler(async (req, res) => {
    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const channelName = req.query.channel;
    const uidParam = req.query.uid || req.user.phone;
    const role = RtcRole.PUBLISHER;
    const expireTime = 3600; // 1 hour

    if (!appID || !appCertificate) {
      return sendError(res, 500, "Agora credentials not configured");
    }

    if (!channelName) {
      return sendError(res, 400, "Channel name is required");
    }

    try {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const privilegeExpireTime = currentTimestamp + expireTime;

      const token = RtcTokenBuilder.buildTokenWithAccount(
        appID,
        appCertificate,
        channelName,
        uidParam,
        role,
        privilegeExpireTime
      );

      console.log(`[AGORA] Token generated for ${req.user.phone}:`, {
        channel: channelName,
        uid: uidParam,
        expireTime: new Date(privilegeExpireTime * 1000).toISOString(),
      });

      res.json({
        token,
        channel: channelName,
        uid: uidParam,
        expireTime: privilegeExpireTime,
      });
    } catch (error) {
      console.error("[AGORA] Token generation error:", error);
      return sendError(res, 500, "Failed to generate Agora token");
    }
  })
);

module.exports = router;
