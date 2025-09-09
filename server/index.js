const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const { body, validationResult } = require("express-validator");
const xss = require("xss");
const bcrypt = require("bcryptjs");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const cors = require("cors");
const PORT = process.env.PORT || 5000;

// Allow CORS for frontend (adjust origin as needed)
app.use(cors({ origin: "*" }));

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*", // Change to your frontend URL in production
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
      io.to(targetSocketId).emit("call-invite", payload);
      console.log(`Forwarded call-invite to ${to}`);
    }
  });

  // Call accept/decline/end: forward to other party
  ["call-accept", "call-decline", "call-end"].forEach((event) => {
    socket.on(event, (payload) => {
      const { to } = payload;
      const targetSocketId = userSockets[to];
      if (targetSocketId) {
        io.to(targetSocketId).emit(event, payload);
        console.log(`Forwarded ${event} to ${to}`);
      }
    });
  });

  socket.on("disconnect", () => {
    if (socket.phone && userSockets[socket.phone] === socket.id) {
      delete userSockets[socket.phone];
      console.log(`User disconnected: ${socket.phone}`);
    }
  });
});

// Connect to SQLite database
const db = new sqlite3.Database("./hola.sqlite", (err) => {
  if (err) {
    console.error("Failed to connect to SQLite database:", err.message);
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
  async (req, res) => {
    try {
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
      if (await dbGet("SELECT id FROM users WHERE phone = ?", [phone])) {
        return sendError(res, 409, "Phone already exists.");
      }
      if (
        username &&
        (await dbGet("SELECT id FROM users WHERE username = ?", [username]))
      ) {
        return sendError(res, 409, "Username already exists.");
      }
      const hashedPassword = await bcrypt.hash(password, 10);
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
      const user = {
        id: insertResult.lastID,
        phone,
        name,
        username,
        avatar,
        bio,
        country,
        is_verified,
      };
      res.status(201).json(userToResponse(user));
    } catch (err) {
      console.error(err);
      return sendError(res, 500, "Database error.");
    }
  }
);

// Login endpoint
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
      res.json(userToResponse(user));
    } catch (err) {
      console.error(err);
      return sendError(res, 500, "Database error");
    }
  }
);

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

// Get all call logs
app.get("/api/call-logs", (req, res) => {
  db.all(
    "SELECT id, contact_name, contact_phone, contact_avatar, type, timestamp, duration FROM call_logs ORDER BY timestamp DESC",
    [],
    (err, rows) => {
      if (err) {
        console.error(err);
        return sendError(res, 500, "Database error.");
      }
      res.json(
        Array.isArray(rows)
          ? rows.map((row) => ({
              ...row,
            }))
          : []
      );
    }
  );
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
