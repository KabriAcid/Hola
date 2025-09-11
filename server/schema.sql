-- USERS: All registered users (auth, profile, Truecaller, etc.)
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
  truecaller_id TEXT UNIQUE, -- For Truecaller integration
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- SETTINGS: Per-user app settings
CREATE TABLE settings (
  user_id INTEGER PRIMARY KEY,
  notifications_enabled BOOLEAN DEFAULT 1,
  dark_mode BOOLEAN DEFAULT 0,
  language TEXT DEFAULT 'en',
  ringtone TEXT,
  privacy_last_seen TEXT CHECK(privacy_last_seen IN ('everyone', 'contacts', 'nobody')) DEFAULT 'everyone',
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- DEVICES: For push notifications, device management
CREATE TABLE devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  device_id TEXT,
  device_type TEXT,
  push_token TEXT,
  last_active DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- CONTACTS: User's personal address book (can include non-users)
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL, -- The user who owns this contact
  contact_user_id INTEGER,   -- If this contact is also a registered user
  name TEXT,
  phone TEXT,
  email TEXT,
  avatar TEXT,
  label TEXT,
  is_favorite BOOLEAN DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (contact_user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- MESSAGES: 1-to-1 and group chat messages
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  recipient_id INTEGER, -- For 1-to-1 chat (user id)
  group_id INTEGER,     -- For group chat (if implemented)
  content TEXT,
  type TEXT CHECK(type IN ('text', 'image', 'audio', 'video', 'file')) DEFAULT 'text',
  status TEXT CHECK(status IN ('sent', 'delivered', 'read')) DEFAULT 'sent',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
  -- group_id: add FOREIGN KEY if you implement groups
);

-- CALL LOGS: All voice/video call history
CREATE TABLE call_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  caller_id INTEGER NOT NULL,
  callee_id INTEGER NOT NULL,
  channel TEXT,
  call_type TEXT CHECK(call_type IN ('audio', 'video')) DEFAULT 'audio',
  direction TEXT CHECK(direction IN ('incoming', 'outgoing')) NOT NULL,
  status TEXT CHECK(status IN ('completed', 'missed', 'failed')) DEFAULT 'completed',
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  duration INTEGER, -- seconds
  FOREIGN KEY (caller_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (callee_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- VERIFICATION CODES: For phone/Truecaller verification
CREATE TABLE verification_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE
);