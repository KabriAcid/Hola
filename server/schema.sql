-- Users table (authentication & profile)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  name TEXT,
  username TEXT UNIQUE,
  avatar TEXT,
  bio TEXT,
  country TEXT,
  city TEXT,
  is_verified BOOLEAN DEFAULT 0,
  verification_code TEXT,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- Verification codes table (optional, for audit/logging)
CREATE TABLE verification_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT,
  phone TEXT,
  email TEXT,
  avatar TEXT,
  initials TEXT,
  label TEXT,
  is_favorite BOOLEAN DEFAULT 0,
  notes TEXT,
  birthday DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE call_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  contact_id INTEGER,
  call_type TEXT CHECK(call_type IN ('incoming', 'outgoing', 'missed')),
  call_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  duration INTEGER, -- seconds
  is_video BOOLEAN DEFAULT 0,
  status TEXT CHECK(status IN ('completed', 'missed', 'failed')) DEFAULT 'completed',
  recording_url TEXT,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE settings (
  user_id INTEGER PRIMARY KEY,
  notifications_enabled BOOLEAN DEFAULT 1,
  dark_mode BOOLEAN DEFAULT 0,
  language TEXT DEFAULT 'en',
  ringtone TEXT,
  privacy_last_seen TEXT CHECK(privacy_last_seen IN ('everyone', 'contacts', 'nobody')) DEFAULT 'everyone',
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  device_id TEXT,
  device_type TEXT,
  push_token TEXT,
  last_active DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);
