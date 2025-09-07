const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const { body, validationResult } = require("express-validator");
const xss = require("xss");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to SQLite database
const db = new sqlite3.Database("./hola.sqlite", (err) => {
  if (err) {
    console.error("Failed to connect to SQLite database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
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

// ...existing code...

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
    console.log("Register request body:", req.body);
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

    try {
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
      res.status(201).json({
        id: insertResult.lastID,
        phone,
        name,
        username,
        avatar,
        bio,
        country,
        is_verified,
      });
    } catch (err) {
      console.error(err);
      return sendError(res, 500, "Database error.");
    }
  }
);

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
      res.json(rows);
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
