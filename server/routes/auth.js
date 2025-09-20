const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body } = require("express-validator");
const xss = require("xss");

const { dbGet, dbRun, dbExists } = require("../database");
const {
  sendError,
  asyncHandler,
  validateRequest,
} = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  "/register",
  [
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone is required")
      .isMobilePhone("en-NG")
      .withMessage("Invalid Nigerian phone number"),
    body("name")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Name must be 1-100 characters"),
    body("username")
      .optional()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage("Username must be 3-30 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores"
      ),
    body("password")
      .isLength({ min: 6, max: 100 })
      .withMessage("Password must be 6-100 characters"),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    // Sanitize inputs
    const phone = xss(req.body.phone.trim());
    const name = xss(req.body.name?.trim() || "");
    let username = xss(req.body.username?.trim() || "");
    const password = req.body.password;

    // Auto-generate username if not provided
    if (!username) {
      const firstName = name.split(" ")[0] || "user";
      const last2 = phone.slice(-2);
      username = `${firstName}${last2}`.toLowerCase();
    }

    // Check for existing user
    const existingUser = await dbGet(
      "SELECT id, is_verified FROM users WHERE phone = ?",
      [phone]
    );

    const existingUsername = await dbGet(
      "SELECT id, is_verified FROM users WHERE username = ?",
      [username]
    );

    // Block if verified user exists
    if (existingUser?.is_verified) {
      return sendError(res, 409, "Phone number already registered");
    }

    if (existingUsername?.is_verified) {
      return sendError(res, 409, "Username already taken");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    let userId;

    if (existingUser && !existingUser.is_verified) {
      // Update incomplete registration
      await dbRun(
        `
      UPDATE users SET name = ?, username = ?, password = ?, avatar = ?, bio = ?, country = ?
      WHERE id = ?
    `,
        [
          name,
          username,
          hashedPassword,
          "default.png",
          "Not available",
          "Nigeria",
          existingUser.id,
        ]
      );
      userId = existingUser.id;
    } else if (existingUsername && !existingUsername.is_verified) {
      // Update incomplete registration by username
      await dbRun(
        `
      UPDATE users SET phone = ?, name = ?, password = ?, avatar = ?, bio = ?, country = ?
      WHERE id = ?
    `,
        [
          phone,
          name,
          hashedPassword,
          "default.png",
          "Not available",
          "Nigeria",
          existingUsername.id,
        ]
      );
      userId = existingUsername.id;
    } else {
      // New registration
      const result = await dbRun(
        `
      INSERT INTO users (phone, name, username, password, avatar, bio, country, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)
    `,
        [
          phone,
          name,
          username,
          hashedPassword,
          "default.png",
          "Not available",
          "Nigeria",
        ]
      );
      userId = result.insertId;
    }

    // Clear old verification codes and create new one
    await dbRun("DELETE FROM verification_codes WHERE user_id = ?", [userId]);
    await dbRun(
      "INSERT INTO verification_codes (user_id, code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))",
      [userId, verificationCode]
    );

    // Log verification code for development
    if (process.env.NODE_ENV === "development") {
      console.log(`[AUTH] Verification code for ${phone}: ${verificationCode}`);
    }

    // Get user data for response
    const user = await dbGet(
      "SELECT id, phone, name, username, avatar, bio, country, is_verified FROM users WHERE id = ?",
      [userId]
    );

    res.status(201).json({
      message: "Registration successful. Please verify your phone number.",
      user,
      verificationRequired: true,
    });
  })
);

/**
 * POST /api/auth/verify
 * Verify phone number with code
 */
router.post(
  "/verify",
  [
    body("phone").trim().notEmpty().withMessage("Phone is required"),
    body("code")
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage("Code must be 6 digits"),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const phone = xss(req.body.phone.trim());
    const code = xss(req.body.code.trim());

    // Find user and valid code
    const verification = await dbGet(
      `
    SELECT u.id, u.phone, u.name, u.username, u.avatar, u.bio, u.country
    FROM users u
    JOIN verification_codes v ON v.user_id = u.id
    WHERE u.phone = ? AND v.code = ? AND u.is_verified = FALSE 
      AND v.expires_at > NOW() AND v.used = FALSE
  `,
      [phone, code]
    );

    if (!verification) {
      return sendError(res, 400, "Invalid or expired verification code");
    }

    // Mark user as verified
    await dbRun(
      "UPDATE users SET is_verified = TRUE, last_login = NOW() WHERE id = ?",
      [verification.id]
    );

    // Mark code as used
    await dbRun("UPDATE verification_codes SET used = TRUE WHERE code = ?", [
      code,
    ]);

    // Create JWT token
    const token = jwt.sign(
      { id: verification.id, phone: verification.phone },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Phone number verified successfully",
      user: {
        id: verification.id,
        phone: verification.phone,
        name: verification.name,
        username: verification.username,
        avatar: verification.avatar,
        bio: verification.bio,
        country: verification.country,
        is_verified: true,
      },
      token,
    });
  })
);

/**
 * POST /api/auth/login
 * Login with phone and password
 */
router.post(
  "/login",
  [
    body("phone").trim().notEmpty().withMessage("Phone is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const phone = xss(req.body.phone.trim());
    const password = req.body.password;

    // Find user
    const user = await dbGet(
      "SELECT id, phone, name, username, avatar, bio, country, password, is_verified FROM users WHERE phone = ?",
      [phone]
    );

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    if (!user.is_verified) {
      return sendError(res, 401, "Please verify your phone number first");
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return sendError(res, 401, "Invalid password");
    }

    // Update last login
    await dbRun("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

    // Create JWT token
    const token = jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Remove password from response
    delete user.password;

    res.json({
      message: "Login successful",
      user,
      token,
    });
  })
);

/**
 * POST /api/auth/resend-code
 * Resend verification code
 */
router.post(
  "/resend-code",
  [body("phone").trim().notEmpty().withMessage("Phone is required")],
  validateRequest,
  asyncHandler(async (req, res) => {
    const phone = xss(req.body.phone.trim());

    // Find unverified user
    const user = await dbGet(
      "SELECT id FROM users WHERE phone = ? AND is_verified = FALSE",
      [phone]
    );

    if (!user) {
      return sendError(
        res,
        404,
        "No pending verification found for this phone number"
      );
    }

    // Generate new verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Clear old codes and create new one
    await dbRun("DELETE FROM verification_codes WHERE user_id = ?", [user.id]);
    await dbRun(
      "INSERT INTO verification_codes (user_id, code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))",
      [user.id, verificationCode]
    );

    // Log for development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[AUTH] New verification code for ${phone}: ${verificationCode}`
      );
    }

    res.json({
      message: "Verification code sent",
      phone,
    });
  })
);

/**
 * DELETE /api/auth/cancel-registration
 * Cancel pending registration
 */
router.delete(
  "/cancel-registration",
  [
    body("code")
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage("Code must be 6 digits"),
  ],
  validateRequest,
  asyncHandler(async (req, res) => {
    const code = xss(req.body.code.trim());

    // Find user with this verification code and not verified
    const user = await dbGet(
      `
    SELECT u.id FROM users u
    JOIN verification_codes v ON v.user_id = u.id
    WHERE v.code = ? AND u.is_verified = FALSE AND v.used = FALSE
  `,
      [code]
    );

    if (!user) {
      return sendError(res, 404, "No pending registration found");
    }

    // Delete user and verification codes (CASCADE will handle codes)
    const result = await dbDelete("users", "id = ?", [user.id]);

    if (result.success) {
      res.json({ message: "Registration cancelled successfully" });
    } else {
      return sendError(res, 500, "Failed to cancel registration");
    }
  })
);

module.exports = router;
