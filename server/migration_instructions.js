// ============================================================
// INDEX.JS MIGRATION STEPS - Replace SQLite with MySQL
// ============================================================

/*
STEP 1: Replace these imports at the top of index.js:

REMOVE:
const sqlite3 = require("sqlite3").verbose();

ADD:
const { dbGet, dbRun, dbAll } = require('./database');
*/

/*
STEP 2: Remove SQLite connection code:

REMOVE this entire section:
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
*/

/*
STEP 3: Remove existing dbGet and dbRun functions:

REMOVE this entire section:
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
*/

/*
STEP 4: Update specific queries throughout your file:

Find and replace these patterns:
*/

// PATTERN 1: Verification code insertion
// FIND:
`INSERT INTO verification_codes (user_id, code, expires_at, created_at) VALUES (?, ?, datetime('now', '+10 minutes'), datetime('now'))`// REPLACE WITH:
`INSERT INTO verification_codes (user_id, code, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))`// PATTERN 2: User verification with time check
// FIND:
`WHERE u.phone = ? AND v.code = ? AND u.is_verified = 0 AND v.expires_at > datetime('now') AND v.used = 0`// REPLACE WITH:
`WHERE u.phone = ? AND v.code = ? AND u.is_verified = FALSE AND v.expires_at > NOW() AND v.used = FALSE`// PATTERN 3: User login update
// FIND:
`UPDATE users SET is_verified = 1, last_login = datetime('now') WHERE id = ?`// REPLACE WITH:
`UPDATE users SET is_verified = TRUE, last_login = NOW() WHERE id = ?`// PATTERN 4: Contact updates - simplify by removing manual timestamp
// FIND:
`UPDATE contacts SET name = ?, phone = ?, avatar = ?, email = ?, is_favorite = ?, updated_at = datetime('now') WHERE id = ? AND owner_id = ?`// REPLACE WITH:
`UPDATE contacts SET name = ?, phone = ?, avatar = ?, email = ?, is_favorite = ? WHERE id = ? AND owner_id = ?`// PATTERN 5: Contact favorite toggle
// FIND:
`UPDATE contacts SET is_favorite = ?, updated_at = datetime('now') WHERE id = ? AND owner_id = ?`// REPLACE WITH:
`UPDATE contacts SET is_favorite = ? WHERE id = ? AND owner_id = ?`// PATTERN 6: Contact insertion
// FIND:
`INSERT INTO contacts (owner_id, name, phone, avatar, email, is_favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`// REPLACE WITH:
`INSERT INTO contacts (owner_id, name, phone, avatar, email, is_favorite) VALUES (?, ?, ?, ?, ?, ?)`// PATTERN 7: Conversation creation
// FIND:
`INSERT INTO conversations (type, created_by, created_at, updated_at, last_message_at) VALUES (?, ?, datetime('now'), datetime('now'), datetime('now'))`// REPLACE WITH:
`INSERT INTO conversations (type, created_by) VALUES (?, ?)`;

/*
STEP 5: Update boolean value parameters in your code:

In your route handlers, when you call dbRun or dbGet, replace:
- 0 with false for boolean fields
- 1 with true for boolean fields

Example:
BEFORE: await dbRun(sql, [...params, 0]) // for is_verified = 0
AFTER:  await dbRun(sql, [...params, false]) // for is_verified = FALSE
*/

/*
STEP 6: Install and test:

1. Install mysql2:
   npm install mysql2

2. Set up your .env file with MySQL credentials:
   DB_HOST=localhost
   DB_USER=root  
   DB_PASS=your_password
   DB_NAME=hola_app

3. Create MySQL database and run schema:
   mysql -u root -p -e "CREATE DATABASE hola_app;"
   mysql -u root -p hola_app < server/mysql_schema.sql

4. Start your server and test all endpoints
*/

// ============================================================
// EXPECTED BENEFITS AFTER MIGRATION:
// ============================================================

/*
✅ Better performance with connection pooling
✅ Automatic timestamp management  
✅ Better data types and constraints
✅ More robust concurrent access
✅ Production-ready database solution
✅ Better error handling and logging
✅ Transaction support for complex operations
*/
