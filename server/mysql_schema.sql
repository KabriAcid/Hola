-- ========================================
-- HOLA APP - MYSQL DATABASE SCHEMA
-- Migrated from SQLite to MySQL
-- ========================================

-- ========================================
-- CORE USER MANAGEMENT
-- ========================================

-- Users table with enhanced profile and presence
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  username VARCHAR(50) UNIQUE,
  avatar TEXT,
  bio TEXT,
  country VARCHAR(100),
  city VARCHAR(100),
  password VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  truecaller_id VARCHAR(100) UNIQUE,
  -- Presence fields
  status ENUM('online', 'offline', 'away', 'busy') DEFAULT 'offline',
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  custom_status VARCHAR(255),
  socket_id VARCHAR(100),
  -- Timestamps
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User contacts with enhanced relationship tracking
CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  contact_user_id INT,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  avatar TEXT,
  label VARCHAR(100),
  is_favorite BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (contact_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Phone verification system
CREATE TABLE IF NOT EXISTS verification_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  code VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Device management for push notifications
CREATE TABLE IF NOT EXISTS devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  device_id VARCHAR(255),
  device_type VARCHAR(50),
  push_token TEXT,
  last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User settings and preferences
CREATE TABLE IF NOT EXISTS settings (
  user_id INT PRIMARY KEY,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  dark_mode BOOLEAN DEFAULT FALSE,
  language VARCHAR(10) DEFAULT 'en',
  ringtone VARCHAR(255),
  privacy_last_seen ENUM('everyone', 'contacts', 'nobody') DEFAULT 'everyone',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- VOICE CALL SYSTEM
-- ========================================

-- Enhanced call logs with detailed tracking
CREATE TABLE IF NOT EXISTS call_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  caller_id INT NOT NULL,
  receiver_id INT,
  receiver_phone VARCHAR(20) NOT NULL,
  receiver_name VARCHAR(255) NOT NULL,
  receiver_avatar TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  duration INT DEFAULT 0, -- in seconds
  channel VARCHAR(255), -- Agora channel ID
  direction ENUM('incoming', 'outgoing') NOT NULL,
  status ENUM('answered', 'missed', 'busy', 'failed', 'received') DEFAULT 'missed',
  FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ========================================
-- MESSAGING SYSTEM (iMessage-style)
-- ========================================

-- Conversation threads (direct and group chats)
CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('direct', 'group') DEFAULT 'direct',
  name VARCHAR(255), -- For group chats
  avatar TEXT, -- For group chats
  created_by INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Track participants in conversations
CREATE TABLE IF NOT EXISTS conversation_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  role ENUM('member', 'admin') DEFAULT 'member',
  is_muted BOOLEAN DEFAULT FALSE,
  last_read_message_id INT,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (last_read_message_id) REFERENCES messages(id) ON DELETE SET NULL,
  UNIQUE(conversation_id, user_id)
);

-- Rich messages with media support
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  content TEXT,
  message_type ENUM('text', 'image', 'audio', 'video', 'file', 'system') DEFAULT 'text',
  file_url TEXT, -- For media messages
  file_size INT, -- In bytes
  file_name VARCHAR(255), -- Original filename
  reply_to_message_id INT, -- For message replies
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  edited_at DATETIME,
  deleted_at DATETIME,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) ON DELETE SET NULL
);

-- Message delivery and read status tracking
CREATE TABLE IF NOT EXISTS message_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(message_id, user_id)
);

-- ========================================
-- PERFORMANCE INDEXES
-- ========================================

-- Users indexes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_seen ON users(last_seen);

-- Contacts indexes
CREATE INDEX idx_contacts_owner_id ON contacts(owner_id);
CREATE INDEX idx_contacts_contact_user_id ON contacts(contact_user_id);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_is_favorite ON contacts(is_favorite);

-- Call logs indexes
CREATE INDEX idx_call_logs_caller_id ON call_logs(caller_id);
CREATE INDEX idx_call_logs_receiver_id ON call_logs(receiver_id);
CREATE INDEX idx_call_logs_started_at ON call_logs(started_at);
CREATE INDEX idx_call_logs_direction ON call_logs(direction);
CREATE INDEX idx_call_logs_status ON call_logs(status);

-- Conversations indexes
CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_created_by ON conversations(created_by);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at);

-- Conversation participants indexes
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);

-- Messages indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_message_type ON messages(message_type);

-- Message status indexes
CREATE INDEX idx_message_status_message_id ON message_status(message_id);
CREATE INDEX idx_message_status_user_id ON message_status(user_id);
CREATE INDEX idx_message_status_status ON message_status(status);

-- Verification codes indexes
CREATE INDEX idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX idx_verification_codes_code ON verification_codes(code);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);

-- Devices indexes
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_device_id ON devices(device_id);

-- ========================================
-- MYSQL TRIGGERS (Equivalent to SQLite triggers)
-- ========================================

-- Trigger to update conversation last_message_at when new message is added
DELIMITER $$
CREATE TRIGGER update_conversation_last_message
AFTER INSERT ON messages
FOR EACH ROW
BEGIN
  UPDATE conversations 
  SET 
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
END$$
DELIMITER ;

-- Trigger to update user last_seen when they come online
DELIMITER $$
CREATE TRIGGER update_user_last_seen
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  IF NEW.status = 'online' THEN
    UPDATE users 
    SET last_seen = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
  END IF;
END$$
DELIMITER ;

-- ========================================
-- SCHEMA MIGRATION NOTES
-- ========================================

-- Key changes from SQLite to MySQL:
-- ✅ INTEGER PRIMARY KEY AUTOINCREMENT → INT AUTO_INCREMENT PRIMARY KEY
-- ✅ TEXT → VARCHAR(255) or TEXT (depending on expected length)
-- ✅ BOOLEAN DEFAULT 0/1 → BOOLEAN DEFAULT FALSE/TRUE
-- ✅ CHECK constraints → ENUM types for better performance
-- ✅ datetime('now') → NOW() or CURRENT_TIMESTAMP
-- ✅ Added ON UPDATE CURRENT_TIMESTAMP for automatic updated_at fields
-- ✅ More explicit data types for better MySQL optimization
-- ✅ DELIMITER changes for trigger definitions

-- ========================================
-- SCHEMA COMPLETE
-- ========================================
