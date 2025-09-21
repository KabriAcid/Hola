# Bolt AI Prompt: Redesign Settings Page for Hola Voice Chat & Messaging App

## Context & Requirements

I need you to redesign the Settings page for our mobile-first voice chat and messaging app called "Hola". The app follows a **strict black and white design system** with clean, minimal aesthetics similar to modern messaging apps.

## Current Component Structure to Follow

### Reusable Components Available:

- `<Avatar>` - Props: `src, alt, size="sm|md|lg|xl", isOnline?`
- `<Button>` - Props: `variant="primary|secondary", isLoading?, className?`
- `<Modal>` - Props: `isOpen, onClose, title?, showCloseButton?`
- `<Input>` - Props: `label, type, placeholder, value, onChange, error?, icon?`
- `<Header>` - Props: `title, showBack?, onBack?`

### Design System:

- **Colors**: Pure black (#000) for primary actions, white backgrounds, gray scale for text
- **Typography**: Clean sans-serif, 16px base, semibold headings
- **Spacing**: 16px base unit, generous padding
- **Animations**: Framer Motion for smooth transitions

## Database User Fields Available

```typescript
interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  email?: string;
  bio?: string;
  username?: string;
  status?: "online" | "offline" | "away" | "busy";
  custom_status?: string;
  last_seen?: string;
}
```

## New Settings Structure Required

### 1. Profile Section (Top)

- Large avatar with edit overlay
- User name, phone, online status
- "Edit Profile" button

### 2. Settings Categories (Each opens new page, not modal)

#### Account Settings:

- Edit Profile (name, avatar, bio, email)
- Phone Number (view only, with verification option)
- Username (editable)
- Privacy Settings

#### Chat & Messaging:

- Message Notifications (toggle)
- Read Receipts (toggle)
- Typing Indicators (toggle)
- Auto-download Media (toggle)
- Chat Backup (enable/disable)

#### Voice & Calls:

- Call Notifications (toggle)
- Auto-answer Calls (toggle)
- Call Recording (toggle with permission note)
- Ringtone Selection
- Microphone Quality Settings

#### Privacy & Security:

- Block List Management
- Last Seen Privacy
- Profile Photo Privacy
- Status Privacy
- Two-Step Verification

#### App Preferences:

- Theme (Light/Dark toggle)
- Language Selection
- Storage Management
- Data Usage Settings

#### Support & Info:

- Help Center
- Report a Problem
- Terms of Service
- Privacy Policy
- App Version Info

#### Account Actions:

- Switch Account (if multiple accounts)
- Sign Out (with confirmation modal)
- Delete Account (with multi-step confirmation)

## Implementation Requirements

### 1. Main Settings Page Structure:

```tsx
// Each setting item should be a pressable row with:
- Icon (left)
- Label & subtitle (center)
- Action indicator: toggle switch OR chevron arrow (right)
- Hover/press animations
```

### 2. Edit Profile Page Features:

- Photo upload with preview
- Image size display (e.g., "2.3 MB")
- Crop/resize functionality
- Form validation
- Save/Cancel buttons

### 3. Individual Settings Pages:

- Each category opens a new page (not modal)
- Header with back button and category title
- Organized subsections with proper spacing
- Toggle switches for on/off settings
- Selection lists for multiple options

### 4. Confirmation Modals:

- Sign out confirmation with "Cancel" and "Sign Out" buttons
- Delete account with multiple warnings
- Destructive actions use red accent color

### 5. Mobile Responsiveness:

- Touch-friendly 44px minimum tap targets
- Safe area handling for notches
- Smooth page transitions
- Optimized scrolling

## Key Features to Implement

### Photo Upload System:

- Tap avatar to open camera/gallery options
- Show file size and dimensions
- Compress large images automatically
- Preview before saving

### Smart Toggles:

- Consistent toggle design (black when on, gray when off)
- Proper accessibility labels
- Smooth animation states

### Navigation Flow:

- Settings → Category Page → Detail Page (if needed)
- Consistent back button behavior
- Breadcrumb-style navigation

### Status Management:

- Custom status text input
- Preset status options (Available, Busy, etc.)
- Auto-status based on activity

## Code Structure Expected

Create these new components:

- `src/components/settings/SettingsPage.tsx` (main settings list)
- `ProfileSettingsPage.tsx` (edit profile)
- `ChatSettingsPage.tsx` (messaging preferences)
- `CallSettingsPage.tsx` (voice call preferences)
- `PrivacySettingsPage.tsx` (privacy controls)
- `AccountActionsPage.tsx` (sign out, switch account)

Use proper TypeScript interfaces for all settings data and follow the existing component patterns in the codebase.

## Sample Layout Structure

```tsx
<SettingsPage>
  <ProfileHeader />
  <SettingsSection title="Account">
    <SettingsRow
      icon={User}
      label="Edit Profile"
      onPress={() => navigate("/settings/profile")}
    />
    <SettingsRow icon={Phone} label="Phone Number" subtitle="+234..." />
  </SettingsSection>

  <SettingsSection title="Chat & Messaging">
    <SettingsRow icon={MessageCircle} label="Notifications" toggle={true} />
    <SettingsRow icon={Eye} label="Read Receipts" toggle={false} />
  </SettingsSection>

  {/* More sections... */}
</SettingsPage>
```

## Additional Technical Notes

### Icon Library:

Use Lucide React icons for consistency:

- User, Phone, MessageCircle, Bell, Shield, Settings, etc.

### State Management:

- Use React hooks for local state
- Form validation with proper error handling
- Loading states for async operations

### File Upload Handling:

```tsx
const handleImageUpload = (file: File) => {
  // Show file size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
  // Compress if > 5MB
  // Show preview
  // Upload to server
};
```

### Toggle Component Pattern:

```tsx
<SettingsRow
  icon={Bell}
  label="Push Notifications"
  subtitle="Get notified about new messages"
  toggle={notificationsEnabled}
  onToggle={setNotificationsEnabled}
/>
```

**Focus on creating a modern, intuitive settings experience that feels native to mobile while maintaining the clean black and white aesthetic of the app.**

---

## Instructions for Implementation

1. **Start with the main SettingsPage.tsx** - Create the primary settings list with all categories
2. **Implement ProfileHeader component** - User info display with edit capabilities
3. **Create individual settings pages** - Each category as a separate page component
4. **Add proper navigation** - React Router integration for page transitions
5. **Implement photo upload** - File handling with preview and compression
6. **Add confirmation modals** - For destructive actions like sign out/delete
7. **Test responsiveness** - Ensure all components work on mobile devices

Remember to maintain consistency with the existing codebase patterns and the black/white design system throughout the implementation.
