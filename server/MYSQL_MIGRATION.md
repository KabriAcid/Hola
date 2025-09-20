# SQLite to MySQL Migration Guide

## Environment Variables Setup

Add these to your `.env` file:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=hola_app
DB_PORT=3306
```

## Installation

1. Install mysql2:

```bash
npm install mysql2
```

2. Create MySQL database:

```sql
CREATE DATABASE hola_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Run the schema:

```bash
mysql -u root -p hola_app < server/mysql_schema.sql
```

## Query Migration Examples

### SQLite → MySQL Function Replacements

#### DateTime Functions

```javascript
// SQLite (OLD)
datetime('now')                    // Current timestamp
datetime('now', '+10 minutes')     // Future timestamp

// MySQL (NEW)
NOW()                              // Current timestamp
DATE_ADD(NOW(), INTERVAL 10 MINUTE) // Future timestamp
```

#### Example Query Conversions

**1. Verification Code Insert (with datetime)**

```javascript
// SQLite (OLD)
const sql = `INSERT INTO verification_codes (user_id, code, expires_at, created_at) 
             VALUES (?, ?, datetime('now', '+10 minutes'), datetime('now'))`;

// MySQL (NEW)
const sql = `INSERT INTO verification_codes (user_id, code, expires_at, created_at) 
             VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), NOW())`;
```

**2. User Update with datetime**

```javascript
// SQLite (OLD)
const sql = `UPDATE users SET is_verified = 1, last_login = datetime('now') WHERE id = ?`;

// MySQL (NEW)
const sql = `UPDATE users SET is_verified = 1, last_login = NOW() WHERE id = ?`;
```

**3. Time Comparison**

```javascript
// SQLite (OLD)
const sql = `SELECT * FROM verification_codes WHERE expires_at > datetime('now')`;

// MySQL (NEW)
const sql = `SELECT * FROM verification_codes WHERE expires_at > NOW()`;
```

**4. Contact Updates**

```javascript
// SQLite (OLD)
const sql = `UPDATE contacts SET name = ?, updated_at = datetime('now') WHERE id = ?`;

// MySQL (NEW) - Can use auto-update or explicit
const sql = `UPDATE contacts SET name = ?, updated_at = NOW() WHERE id = ?`;
// OR just: `UPDATE contacts SET name = ? WHERE id = ?` (auto-updates due to ON UPDATE CURRENT_TIMESTAMP)
```

## Code Migration Pattern

### Before (SQLite)

```javascript
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./hola.sqlite");

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
      else resolve(this); // 'this' has lastID, changes
    });
  });
}
```

### After (MySQL)

```javascript
const { dbGet, dbRun } = require("./database");

// Usage remains the same:
const user = await dbGet("SELECT * FROM users WHERE phone = ?", [phone]);
const result = await dbRun("INSERT INTO users (phone, name) VALUES (?, ?)", [
  phone,
  name,
]);
console.log("Inserted ID:", result.insertId);
```

## Migration Checklist

- [x] Replace sqlite3 with mysql2/promise
- [x] Update database connection to use connection pool
- [x] Convert AUTOINCREMENT to AUTO_INCREMENT
- [x] Replace datetime() functions with NOW()
- [x] Convert CHECK constraints to ENUM types
- [x] Add proper VARCHAR lengths instead of flexible TEXT
- [x] Update BOOLEAN defaults from 0/1 to FALSE/TRUE
- [x] Add ON UPDATE CURRENT_TIMESTAMP for auto-updating timestamps
- [x] Convert triggers to MySQL syntax with DELIMITER
- [ ] Update all datetime() calls in your code
- [ ] Test all endpoints after migration
- [ ] Backup existing SQLite data if needed

## Performance Benefits

- Connection pooling for better concurrent handling
- Proper data types for better storage efficiency
- ENUMs instead of CHECK constraints for faster lookups
- Automatic timestamp updates
- Better indexing performance with typed columns
