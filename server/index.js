const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const { body, validationResult } = require("express-validator");
const xss = require("xss");
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

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hola backend is running!");
});

// User registration endpoint
app.post(
  "/api/register",
  [
    body("phone")
      .trim()
      .notEmpty()
      .withMessage("Phone is required")
      .isMobilePhone()
      .withMessage("Invalid phone number"),
    body("name").optional().trim().escape(),
    body("email").optional().isEmail().normalizeEmail(),
    body("username").optional().trim().escape(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Sanitize input
    const phone = xss(req.body.phone);
    const name = xss(req.body.name || "");
    const email = xss(req.body.email || "");
    const username = xss(req.body.username || "");
    const avatar = xss(req.body.avatar || "");

    // Insert user
    const sql = `INSERT INTO users (phone, name, email, username, avatar) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [phone, name, email, username, avatar], function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res
            .status(409)
            .json({ error: "Phone, email, or username already exists." });
        }
        return res.status(500).json({ error: "Database error." });
      }
      res
        .status(201)
        .json({ id: this.lastID, phone, name, email, username, avatar });
    });
  }
);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
