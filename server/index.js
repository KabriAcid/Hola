const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const { body, validationResult } = require("express-validator");
const xss = require("xss");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to SQLite database
const db = new sqlite3.Database("./hola.sqlite", (err) => {
  try {
    // Check for existing phone
    db.get(
      "SELECT id FROM users WHERE phone = ?",
      [phone],
      async (err, row) => {
        if (err) return res.status(500).json({ error: "Database error." });
        if (row)
          return res.status(409).json({ error: "Phone already exists." });

        // Check for existing email if provided
        if (email) {
          db.get(
            "SELECT id FROM users WHERE email = ?",
            [email],
            async (err, row) => {
              if (err)
                return res.status(500).json({ error: "Database error." });
              if (row)
                return res.status(409).json({ error: "Email already exists." });

              // Check for existing username if provided
              if (username) {
                db.get(
                  "SELECT id FROM users WHERE username = ?",
                  [username],
                  async (err, row) => {
                    if (err)
                      return res.status(500).json({ error: "Database error." });
                    if (row)
                      return res
                        .status(409)
                        .json({ error: "Username already exists." });

                    // All clear, insert user
                    const hashedPassword = await bcrypt.hash(password, 10);
                    const sql = `INSERT INTO users (phone, name, email, username, avatar, password) VALUES (?, ?, ?, ?, ?, ?)`;
                    db.run(
                      sql,
                      [phone, name, email, username, avatar, hashedPassword],
                      function (err) {
                        if (err)
                          return res
                            .status(500)
                            .json({ error: "Database error." });
                        res
                          .status(201)
                          .json({
                            id: this.lastID,
                            phone,
                            name,
                            email,
                            username,
                            avatar,
                          });
                      }
                    );
                  }
                );
              } else {
                // No username, insert user
                const hashedPassword = await bcrypt.hash(password, 10);
                const sql = `INSERT INTO users (phone, name, email, username, avatar, password) VALUES (?, ?, ?, ?, ?, ?)`;
                db.run(
                  sql,
                  [phone, name, email, username, avatar, hashedPassword],
                  function (err) {
                    if (err)
                      return res.status(500).json({ error: "Database error." });
                    res
                      .status(201)
                      .json({
                        id: this.lastID,
                        phone,
                        name,
                        email,
                        username,
                        avatar,
                      });
                  }
                );
              }
            }
          );
        } else {
          // No email, check username if provided
          if (username) {
            db.get(
              "SELECT id FROM users WHERE username = ?",
              [username],
              async (err, row) => {
                if (err)
                  return res.status(500).json({ error: "Database error." });
                if (row)
                  return res
                    .status(409)
                    .json({ error: "Username already exists." });

                // All clear, insert user
                const hashedPassword = await bcrypt.hash(password, 10);
                const sql = `INSERT INTO users (phone, name, email, username, avatar, password) VALUES (?, ?, ?, ?, ?, ?)`;
                db.run(
                  sql,
                  [phone, name, email, username, avatar, hashedPassword],
                  function (err) {
                    if (err)
                      return res.status(500).json({ error: "Database error." });
                    res
                      .status(201)
                      .json({
                        id: this.lastID,
                        phone,
                        name,
                        email,
                        username,
                        avatar,
                      });
                  }
                );
              }
            );
          } else {
            // No email or username, insert user
            const hashedPassword = await bcrypt.hash(password, 10);
            const sql = `INSERT INTO users (phone, name, email, username, avatar, password) VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(
              sql,
              [phone, name, email, username, avatar, hashedPassword],
              function (err) {
                if (err)
                  return res.status(500).json({ error: "Database error." });
                res
                  .status(201)
                  .json({
                    id: this.lastID,
                    phone,
                    name,
                    email,
                    username,
                    avatar,
                  });
              }
            );
          }
        }
      }
    );
  } catch (err) {
    return res.status(500).json({ error: "Server error." });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
