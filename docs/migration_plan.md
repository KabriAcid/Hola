# Database Migration Plan for iMessage-Style Chat System

## Current Schema Analysis

### Existing Tables (KEEP AS-IS):

- **users**: Core user data ✅
- **contacts**: Contact relationships ✅
- **call_logs**: Call history ✅
- **verification_codes**: Phone verification ✅
- **settings**: User preferences ✅
- **devices**: Device management ✅

### Existing Messages Table Issues:

- Too simple structure
- No conversation threading
- No message status tracking
- No support for media messages
- No group chat support

## Migration Strategy: Additive Approach

### Phase 1: Add New Tables (Non-Breaking)

Add new tables alongside existing ones:

1. **conversations** - Chat thread management
2. **conversation_participants** - Who's in each chat
3. **message_status** - Track delivery/read status
4. **user_presence** - Online/offline status
5. **enhanced_messages** - Rich message support

### Phase 2: Data Migration (Background)

- Create conversations from existing message threads
- Migrate existing messages to enhanced structure
- Preserve all existing data

### Phase 3: API Updates (Gradual)

- Update endpoints to use new structure
- Maintain backward compatibility
- Gradually deprecate old endpoints

### Phase 4: Frontend Updates

- Update components to use new data structure
- Enhanced UI features (typing, status, etc.)

## Benefits of This Approach:

✅ Zero data loss
✅ No application downtime
✅ Rollback capability
✅ Gradual feature rollout
✅ Existing functionality preserved

## Database Changes Summary:

### New Tables to Add:

```sql
-- Enhanced conversation management
conversations
conversation_participants
message_status
user_presence

-- Keep existing but add enhanced version
enhanced_messages (alongside old messages)
```

### Existing Tables - Minor Updates:

```sql
-- Add columns to existing tables (non-breaking)
ALTER TABLE users ADD COLUMN socket_id TEXT;
ALTER TABLE users ADD COLUMN last_seen DATETIME;
ALTER TABLE messages ADD COLUMN conversation_id INTEGER; -- Link to new system
```

This approach ensures we can roll out the new chat system incrementally while keeping everything working!
