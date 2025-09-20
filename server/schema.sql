-- ========================================
-- HOLA APP - UNIFIED DATABASE SCHEMA
-- Enhanced schema with voice calls, messaging, and contacts
-- ========================================

PRAGMA foreign_keys = ON;

-- ========================================
-- CORE USER MANAGEMENT
-- ========================================

-- Users table with enhanced profile and presence
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  name TEXT,
  username TEXT UNIQUE,
  avatar TEXT,
  bio TEXT,
  country TEXT,
  city TEXT,
  password TEXT,
  is_verified BOOLEAN DEFAULT 0,
  truecaller_id TEXT UNIQUE,
  -- Presence fields
  status TEXT CHECK(status IN ('online', 'offline', 'away', 'busy')) DEFAULT 'offline',
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  custom_status TEXT,
  socket_id TEXT,
  -- Timestamps
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User contacts with enhanced relationship tracking
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  contact_user_id INTEGER,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  avatar TEXT,
  label TEXT,
  is_favorite BOOLEAN DEFAULT 0,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Phone verification system
CREATE TABLE IF NOT EXISTS verification_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Device management for push notifications
CREATE TABLE IF NOT EXISTS devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  device_id TEXT,
  device_type TEXT,
  push_token TEXT,
  last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User settings and preferences
CREATE TABLE IF NOT EXISTS settings (
  user_id INTEGER PRIMARY KEY,
  notifications_enabled BOOLEAN DEFAULT 1,
  dark_mode BOOLEAN DEFAULT 0,
  language TEXT DEFAULT 'en',
  ringtone TEXT,
  privacy_last_seen TEXT CHECK(privacy_last_seen IN ('everyone', 'contacts', 'nobody')) DEFAULT 'everyone',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- VOICE CALL SYSTEM
-- ========================================

-- Enhanced call logs with detailed tracking
CREATE TABLE IF NOT EXISTS call_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  caller_id INTEGER NOT NULL,
  receiver_id INTEGER,
  receiver_phone TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  receiver_avatar TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  duration INTEGER DEFAULT 0, -- in seconds
  channel TEXT, -- Agora channel ID
  direction TEXT CHECK(direction IN ('incoming', 'outgoing')) NOT NULL,
  status TEXT CHECK(status IN ('answered', 'missed', 'busy', 'failed', 'received')) DEFAULT 'missed',
  FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ========================================
-- MESSAGING SYSTEM (iMessage-style)
-- ========================================

-- Conversation threads (direct and group chats)
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT CHECK(type IN ('direct', 'group')) DEFAULT 'direct',
  name TEXT, -- For group chats
  avatar TEXT, -- For group chats
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Track participants in conversations
CREATE TABLE IF NOT EXISTS conversation_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  role TEXT CHECK(role IN ('member', 'admin')) DEFAULT 'member',
  is_muted BOOLEAN DEFAULT 0,
  last_read_message_id INTEGER,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (last_read_message_id) REFERENCES messages(id) ON DELETE SET NULL,
  UNIQUE(conversation_id, user_id)
);

-- Rich messages with media support
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  content TEXT,
  message_type TEXT CHECK(message_type IN ('text', 'image', 'audio', 'video', 'file', 'system')) DEFAULT 'text',
  file_url TEXT, -- For media messages
  file_size INTEGER, -- In bytes
  file_name TEXT, -- Original filename
  reply_to_message_id INTEGER, -- For message replies
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  edited_at DATETIME,
  deleted_at DATETIME,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) ON DELETE SET NULL
);

-- Message delivery and read status tracking
CREATE TABLE IF NOT EXISTS message_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT CHECK(status IN ('sent', 'delivered', 'read')) DEFAULT 'sent',
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(message_id, user_id)
);

-- ========================================
-- PERFORMANCE INDEXES
-- ========================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_user_id ON contacts(contact_user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_is_favorite ON contacts(is_favorite);

-- Call logs indexes
CREATE INDEX IF NOT EXISTS idx_call_logs_caller_id ON call_logs(caller_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_receiver_id ON call_logs(receiver_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_started_at ON call_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_call_logs_direction ON call_logs(direction);
CREATE INDEX IF NOT EXISTS idx_call_logs_status ON call_logs(status);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at);

-- Conversation participants indexes
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);

-- Message status indexes
CREATE INDEX IF NOT EXISTS idx_message_status_message_id ON message_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_status_user_id ON message_status(user_id);
CREATE INDEX IF NOT EXISTS idx_message_status_status ON message_status(status);

-- Verification codes indexes
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);

-- Devices indexes
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);

-- ========================================
-- INITIAL DATA AND TRIGGERS
-- ========================================

-- Trigger to update conversation last_message_at when new message is added
CREATE TRIGGER IF NOT EXISTS update_conversation_last_message
AFTER INSERT ON messages
BEGIN
  UPDATE conversations 
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
END;

-- Trigger to update user last_seen when they come online
CREATE TRIGGER IF NOT EXISTS update_user_last_seen
AFTER UPDATE OF status ON users
WHEN NEW.status = 'online'
BEGIN
  UPDATE users 
  SET last_seen = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- ========================================
-- SCHEMA COMPLETE
-- ========================================

-- This unified schema supports:
-- ✅ User management with presence tracking
-- ✅ Contact management with favorites
-- ✅ Voice calls with detailed logging
-- ✅ iMessage-style messaging with rich media
-- ✅ Message status tracking (sent/delivered/read)
-- ✅ Group and direct conversations
-- ✅ Real-time features support
-- ✅ Push notification support
-- ✅ Comprehensive indexing for performance
