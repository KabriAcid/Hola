const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { body, validationResult } = require("express-validator");
const xss = require("xss");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require("cors");
// Load environment variables from root .env (one level up) so starting the server
// from within the /server directory (nodemon .) still picks them up.
// This avoids the 500 "Agora credentials not set" error when process.cwd() !== project root.
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const PORT = process.env.PORT || 5000;

// Early diagnostics (do NOT print secret values, only presence flags)
console.log("[BOOT] Env presence:", {
  AGORA_APP_ID: !!process.env.AGORA_APP_ID,
  AGORA_APP_CERTIFICATE: !!process.env.AGORA_APP_CERTIFICATE,
  JWT_SECRET: !!process.env.JWT_SECRET,
});

// Allow CORS for frontend (adjust origin as needed)
app.use(cors({ origin: "*" }));

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// In-memory map: phone number -> socket.id
const userSockets = {};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Client should emit 'register' with their phone number after connecting
  socket.on("register", (phone) => {
    userSockets[phone] = socket.id;
    socket.phone = phone;
    console.log(`User registered: ${phone} -> ${socket.id}`);
  });

  // Call invite: { from, to, channel }
  socket.on("call-invite", (payload) => {
    const { to } = payload;
    const targetSocketId = userSockets[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-incoming", payload);
      console.log(`Forwarded call-invite to ${to}`);
    }
  });

  // Call accept: { from, to, channel }
  socket.on("call-accept", (payload) => {
    const { to } = payload;
    const targetSocketId = userSockets[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-accepted", payload);
      console.log(`Forwarded call-accept to ${to}`);
    }
  });

  // Call decline: { from, to, channel }
  socket.on("call-decline", (payload) => {
    const { to } = payload;
    const targetSocketId = userSockets[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-declined", payload);
      console.log(`Forwarded call-decline to ${to}`);
    }
  });

  // Call end: { from, to, channel }
  socket.on("call-end", (payload) => {
    const { to } = payload;
    const targetSocketId = userSockets[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-ended", payload);
      console.log(`Forwarded call-end to ${to}`);
    }
  });

  socket.on("disconnect", () => {
    if (socket.phone && userSockets[socket.phone] == socket.id) {
      delete userSockets[socket.phone];
      console.log(`User disconnected: ${socket.phone}`);
    }
  });
});

// Utility to wrap async route handlers and catch errors
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Connect to SQLite database
const db = new sqlite3.Database("./hola.sqlite", (err) => {
  if (err) {
    console.error("Failed to connect to SQLite database:", err.message);
  } else {
    // Enable WAL mode for better concurrency
    db.run("PRAGMA journal_mode = WAL;");
    // Set busy timeout to 5 seconds
    db.run("PRAGMA busy_timeout = 5000;");
  }
});

// Parse JSON bodies for all requests
app.use(express.json());

// Helper for error responses
function sendError(res, code, message) {
  return res.status(code).json({ error: message });
}

// Promisified db.get and db.run
function dbGet(sql, params) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}
function dbRun(sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

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
];

function userToResponse(user) {
  const result = {};
  USER_FIELDS.forEach((f) => {
    if (user[f] !== undefined) result[f] = user[f];
  });
  return result;
}

// Registration endpoint
app.post(
  "/api/register",
  [
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone is required")
      .isMobilePhone("en-NG")
      .withMessage("Invalid Nigerian phone number"),
    body("name").optional().trim().escape(),
    body("username").optional().trim().escape(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, 400, errors.array()[0].msg);
    }
    // Sanitize input
    const phone = xss(req.body.phone);
    const name = xss(req.body.name || "");
    let username = xss(req.body.username || "");
    const password = xss(req.body.password);
    // Auto-generate username if not provided
    if (!username) {
      const firstName = name.split(" ")[0] || "user";
      const last2 = phone.slice(-2);
      username = `${firstName}${last2}`;
    }
    // Defaults
    const avatar = "default.png";
    const bio = "Not available";
    const country = "Nigeria";
    const is_verified = 0;
    // Check for existing user by phone
    const existingUser = await dbGet("SELECT * FROM users WHERE phone = ?", [
      phone,
    ]);
    // Check for existing username
    const existingUsername = username
      ? await dbGet("SELECT * FROM users WHERE username = ?", [username])
      : null;
    if (existingUser && existingUser.is_verified == 1) {
      return sendError(res, 409, "Phone already exists.");
    }
    if (existingUsername && existingUsername.is_verified == 1) {
      return sendError(res, 409, "Username already exists.");
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate a random 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    let userId;
    if (existingUser && existingUser.is_verified == 0) {
      // Update incomplete registration
      await dbRun(
        `UPDATE users SET name = ?, username = ?, avatar = ?, bio = ?, country = ?, password = ? WHERE id = ?`,
        [name, username, avatar, bio, country, hashedPassword, existingUser.id]
      );
      userId = existingUser.id;
    } else if (existingUsername && existingUsername.is_verified == 0) {
      // Update incomplete registration by username
      await dbRun(
        `UPDATE users SET phone = ?, name = ?, avatar = ?, bio = ?, country = ?, password = ? WHERE id = ?`,
        [phone, name, avatar, bio, country, hashedPassword, existingUsername.id]
      );
      userId = existingUsername.id;
    } else {
      // New registration
      const insertSql = `INSERT INTO users (phone, name, username, avatar, bio, country, is_verified, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const insertResult = await dbRun(insertSql, [
        phone,
        name,
        username,
        avatar,
        bio,
        country,
        is_verified,
        hashedPassword,
      ]);
      userId = insertResult.lastID;
    }
    // Save verification code in verification_codes table (delete old first)
    await dbRun(`DELETE FROM verification_codes WHERE user_id = ?`, [userId]);
    await dbRun(
      `INSERT INTO verification_codes (user_id, code, created_at) VALUES (?, ?, datetime('now'))`,
      [userId, verificationCode]
    );
    // Log the code for debugging
    console.log(`Verification code for ${phone}: ${verificationCode}`);
    const user = {
      id: userId,
      phone,
      name,
      username,
      avatar,
      bio,
      country,
      is_verified,
    };
    res.status(201).json(userToResponse(user));
  })
);

// Verification endpoint: verify user by phone and code
app.post(
  "/api/verify",
  asyncHandler(async (req, res) => {
    const { phone, code } = req.body;
    if (!phone || !code) return sendError(res, 400, "Missing phone or code");
    // Find user and code
    const user = await dbGet(
      `SELECT u.id FROM users u
        JOIN verification_codes v ON v.user_id = u.id
        WHERE u.phone = ? AND v.code = ? AND u.is_verified = 0`,
      [phone, code]
    );
    if (!user) return sendError(res, 400, "Invalid verification code");
    // Mark user as verified and update last_login
    await dbRun(
      "UPDATE users SET is_verified = 1, last_login = datetime('now') WHERE id = ?",
      [user.id]
    );
    // Delete verification code
    await dbRun("DELETE FROM verification_codes WHERE code = ?", [code]);
    return res.json({ success: true });
  })
);

// Login endpoint (returns JWT)
app.post(
  "/api/login",
  [
    body("phone").trim().notEmpty().withMessage("Phone is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 400, errors.array()[0].msg);
      }
      const phone = xss(req.body.phone);
      const password = xss(req.body.password);
      const user = await dbGet("SELECT * FROM users WHERE phone = ?", [phone]);
      if (!user) return sendError(res, 404, "User not found");
      const match = await bcrypt.compare(password, user.password);
      if (!match) return sendError(res, 401, "Invalid password");
      // Create JWT
      const token = jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, {
        expiresIn: "7d",
      });
      res.json({ user: userToResponse(user), token });
    } catch (err) {
      console.error(err);
      return sendError(res, 500, "Database error");
    }
  }
);
// Middleware to authenticate JWT
function authenticateJWT(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return sendError(res, 401, "Missing or invalid Authorization header");
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return sendError(res, 401, "Invalid or expired token");
    req.user = decoded;
    next();
  });
}

// Get current user (JWT protected)
app.get("/api/me", authenticateJWT, async (req, res) => {
  try {
    const user = await dbGet(
      `SELECT ${USER_FIELDS.join(", ")} FROM users WHERE id = ?`,
      [req.user.id]
    );
    if (!user) return sendError(res, 404, "User not found");
    res.json(userToResponse(user));
  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Database error");
  }
});

// --- AGORA TOKEN GENERATION ENDPOINT ---
app.get("/api/agora-token", (req, res) => {
  try {
    const appID = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const channelName = req.query.channel;
    const uidParam = req.query.uid;
    const role = RtcRole.PUBLISHER;
    const expireTime = 3600; // 1 hour

    if (!appID || !appCertificate) {
      console.error("[AGORA] Missing credentials (ID / CERT)");
      return res
        .status(500)
        .json({ error: "Agora credentials not set in backend environment" });
    }
    if (!channelName) {
      return res.status(400).json({ error: "channel is required" });
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTimestamp + expireTime;

    // Detailed logging for debugging
    // Always use buildTokenWithAccount for phone numbers (preserve leading zeros)
    const account = uidParam || "0";
    const token = RtcTokenBuilder.buildTokenWithAccount(
      appID,
      appCertificate,
      channelName,
      account,
      role,
      privilegeExpireTime
    );
    console.log("[AGORA] Token generated:", {
      method: "buildTokenWithAccount",
      channel: channelName,
      uid: account,
      uidType: typeof account,
    });
    return res.json({ token });
  } catch (err) {
    console.error("[AGORA] Token generation failed", err);
    return res.status(500).json({ error: "Failed to generate token" });
  }
});

// Get user by username (future route)
app.get("/api/user/:username", async (req, res) => {
  try {
    const username = xss(req.params.username);
    const user = await dbGet(
      `SELECT ${USER_FIELDS.join(", ")} FROM users WHERE username = ?`,
      [username]
    );
    if (!user) return sendError(res, 404, "User not found");
    res.json(userToResponse(user));
  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Database error");
  }
});

// Simple env health endpoint (never returns actual secrets)
app.get("/api/env-health", (req, res) => {
  res.json({
    AGORA_APP_ID: !!process.env.AGORA_APP_ID,
    AGORA_APP_CERTIFICATE: !!process.env.AGORA_APP_CERTIFICATE,
    JWT_SECRET: !!process.env.JWT_SECRET,
  });
});

// Get contacts for the current user (JWT protected)
app.get("/api/contacts", authenticateJWT, async (req, res) => {
  try {
    const rows = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, name, phone, avatar, is_favorite as isFavorite, email, label, notes, created_at, updated_at FROM contacts WHERE owner_id = ? ORDER BY name COLLATE NOCASE`,
        [req.user.id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    res.json(rows);
  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Database error");
  }
});

// Get call logs for the current user (JWT protected)
app.get("/api/call-logs", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    db.all(
      `SELECT id, caller_id, callee_id, channel, call_type, direction, status, started_at, ended_at, duration
       FROM call_logs
       WHERE caller_id = ? OR callee_id = ?
       ORDER BY started_at DESC`,
      [userId, userId],
      (err, rows) => {
        if (err) {
          console.error(err);
          return sendError(res, 500, "Database error.");
        }
        res.json(Array.isArray(rows) ? rows : []);
      }
    );
  } catch (err) {
    console.error(err);
    return sendError(res, 500, "Database error.");
  }
});

// Delete pending registration by verification code
app.delete(
  "/api/pending-registration/:code",
  asyncHandler(async (req, res) => {
    const code = req.params.code;
    if (!code) return sendError(res, 400, "Missing code");
    // Find user with this verification_code and not verified
    const user = await dbGet(
      `SELECT u.id FROM users u
        JOIN verification_codes v ON v.user_id = u.id
        WHERE v.code = ? AND u.is_verified = 0`,
      [code]
    );
    if (!user) return sendError(res, 404, "No pending registration found");
    // Delete user
    await dbRun("DELETE FROM users WHERE id = ?", [user.id]);
    // Delete verification code
    await dbRun("DELETE FROM verification_codes WHERE code = ?", [code]);
    return res.json({ success: true });
  })
);
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
