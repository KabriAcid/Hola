# 💬 iMessage-Style Chat System Implementation Plan

## 🏗️ Architecture Overview

### Core Components

1. **Real-time WebSocket Communication** (Socket.io)
2. **Message Persistence** (SQLite Database)
3. **Message Status Tracking** (sent → delivered → read)
4. **Conversation Management** (1-to-1 and group chats)
5. **Media Message Support** (text, images, audio, files)
6. **Offline Message Queue** (store & forward when user comes online)

## 📊 Enhanced Database Schema

### New Tables Required:

```sql
-- CONVERSATIONS: Chat threads between users
CREATE TABLE conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT CHECK(type IN ('direct', 'group')) DEFAULT 'direct',
  name TEXT, -- For group chats
  avatar TEXT, -- For group chats
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- CONVERSATION_PARTICIPANTS: Who's in each conversation
CREATE TABLE conversation_participants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  role TEXT CHECK(role IN ('member', 'admin')) DEFAULT 'member',
  is_muted BOOLEAN DEFAULT 0,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(conversation_id, user_id)
);

-- Enhanced MESSAGES table
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  content TEXT,
  message_type TEXT CHECK(message_type IN ('text', 'image', 'audio', 'video', 'file', 'system')) DEFAULT 'text',
  file_url TEXT, -- For media messages
  file_size INTEGER, -- In bytes
  reply_to_message_id INTEGER, -- For message replies
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  edited_at DATETIME,
  deleted_at DATETIME,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) ON DELETE SET NULL
);

-- MESSAGE_STATUS: Track delivery and read status per user
CREATE TABLE message_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  status TEXT CHECK(status IN ('sent', 'delivered', 'read')) DEFAULT 'sent',
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(message_id, user_id)
);

-- USER_PRESENCE: Online/offline status
CREATE TABLE user_presence (
  user_id INTEGER PRIMARY KEY,
  status TEXT CHECK(status IN ('online', 'offline', 'away', 'busy')) DEFAULT 'offline',
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  custom_status TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🔄 Message Flow Architecture

### 1. **Sending a Message**

```
User A types message → Frontend validates → Send to server via WebSocket
                                                   ↓
Server receives → Store in database → Update conversation
                                                   ↓
Check if User B is online → If yes: Send via WebSocket
                         → If no: Store for delivery when online
                                                   ↓
User B receives → Send delivery confirmation → Update message status
                                                   ↓
User B reads message → Send read confirmation → Update message status
```

### 2. **Real-time Events** (WebSocket)

```javascript
// Client → Server
"message:send"; // Send new message
"message:read"; // Mark message as read
"typing:start"; // User started typing
"typing:stop"; // User stopped typing
"user:online"; // User came online
"user:offline"; // User went offline

// Server → Client
"message:new"; // New message received
"message:delivered"; // Message was delivered
"message:read"; // Message was read
"typing:start"; // Someone is typing
"typing:stop"; // Someone stopped typing
"user:status"; // User status changed
```

## 🎯 Implementation Phases

### Phase 1: Core Messaging (Week 1)

- [ ] Update database schema
- [ ] Create conversation endpoints
- [ ] Implement basic send/receive messages
- [ ] WebSocket integration for real-time messaging
- [ ] Message status tracking (sent/delivered/read)

### Phase 2: UI/UX Enhancement (Week 2)

- [ ] Chat interface similar to iMessage
- [ ] Message bubbles with status indicators
- [ ] Typing indicators
- [ ] Online/offline status
- [ ] Message timestamps and grouping

### Phase 3: Advanced Features (Week 3)

- [ ] Message replies and reactions
- [ ] File/media sharing
- [ ] Message search
- [ ] Conversation management
- [ ] Push notifications

### Phase 4: Polish & Optimization (Week 4)

- [ ] Message encryption (optional)
- [ ] Performance optimization
- [ ] Offline support
- [ ] Message sync across devices

## 💡 Key iMessage Features to Implement

### 1. **Message Status System**

- ✓ **Sent**: Message left user's device
- ✓ **Delivered**: Message reached recipient's device
- ✓ **Read**: Recipient opened and viewed message

### 2. **Smart Message Grouping**

- Group consecutive messages from same sender
- Time-based grouping (within 5 minutes)
- Different bubble styles for sent vs received

### 3. **Typing Indicators**

- Real-time "User is typing..." indicators
- Multiple user typing support for groups

### 4. **Rich Message Types**

- Text messages with emoji support
- Photo and video sharing
- Audio messages (voice notes)
- File attachments
- Location sharing (future)

### 5. **Conversation Management**

- Conversation list with last message preview
- Unread message count badges
- Message search within conversations
- Archive/delete conversations

## 🛠️ Technical Implementation Details

### Frontend Components Needed:

```
src/components/messages/
├── ConversationList.tsx        ✓ (exists, needs enhancement)
├── ChatScreen.tsx             ✓ (exists, needs enhancement)
├── MessageBubble.tsx          → New
├── MessageInput.tsx           → New
├── TypingIndicator.tsx        → New
├── MessageStatus.tsx          → New
├── MediaMessage.tsx           → New
└── ConversationHeader.tsx     → New
```

### Backend API Endpoints:

```
POST   /api/conversations              → Create conversation
GET    /api/conversations              → Get user's conversations
GET    /api/conversations/:id/messages → Get conversation messages
POST   /api/conversations/:id/messages → Send message
PUT    /api/messages/:id/read          → Mark message as read
DELETE /api/messages/:id               → Delete message
```

### WebSocket Events:

```javascript
// Real-time message handling
io.on("connection", (socket) => {
  socket.on("join:conversation", conversationId);
  socket.on("message:send", messageData);
  socket.on("message:read", messageId);
  socket.on("typing:start", conversationId);
  socket.on("typing:stop", conversationId);
});
```

## 🎨 UI/UX Design Principles

### 1. **iMessage Visual Style**

- Clean white/gray message bubbles
- Blue bubbles for sent messages
- Gray bubbles for received messages
- Rounded corners and proper spacing

### 2. **Smart Message Layout**

- Right-aligned sent messages
- Left-aligned received messages
- Timestamps appear on tap/hover
- Group messages by time and sender

### 3. **Status Indicators**

- Subtle status indicators below messages
- "Delivered" and "Read" text
- Typing indicators with animated dots

### 4. **Responsive Design**

- Mobile-first approach
- Smooth animations and transitions
- Touch-friendly interface elements

Would you like me to start implementing this chat system? I can begin with Phase 1 - the core messaging functionality and database schema updates.
