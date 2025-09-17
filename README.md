# Hola - Audio Call App

A modern, mobile-first audio calling application built with React, TypeScript, and Tailwind CSS. Features a clean black and white design with smooth animations and a comprehensive set of calling and messaging features.

## 🚀 Features

### Authentication
- **Multiple Login Methods**: Phone/password and Truecaller integration
- **Registration Flow**: Complete signup with phone verification
- **Persistent Sessions**: Auto-login with localStorage
- **Real-time Validation**: Form validation with error handling

### Contacts Management
- **Full CRUD Operations**: Add, edit, delete, and search contacts
- **Avatar Support**: Upload and preview contact photos
- **Favorites System**: Mark important contacts as favorites
- **Online Status**: Visual indicators for contact availability

### Audio Calling
- **Simulated Calls**: Complete in-call experience with controls
- **Call Controls**: Mute, speaker, and end call functionality
- **Call History**: Track incoming, outgoing, and missed calls
- **Call Duration**: Timer and duration tracking

### Messaging
- **SMS-style Chat**: Clean, modern messaging interface
- **Real-time Updates**: Instant message delivery simulation
- **Conversation Management**: Organized chat threads
- **Unread Indicators**: Visual badges for new messages

### Navigation & UI
- **Bottom Navigation**: Easy access to all main features
- **Responsive Design**: Mobile-first, touch-friendly interface
- **Smooth Animations**: Framer Motion powered transitions
- **Accessibility**: High contrast, large tap targets

### Settings
- **Profile Management**: Edit name, avatar, and personal info
- **Preferences**: Notifications, dark mode toggle
- **Privacy Options**: Security and privacy controls
- **Account Actions**: Secure logout functionality

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Lucide React for consistent iconography
- **Routing**: React Router DOM for navigation
- **State Management**: React hooks + localStorage
- **Mock Data**: Comprehensive demo data for testing

## 📱 Design System

### Color Scheme
- **Primary**: Pure black (#000000) for buttons and actions
- **Secondary**: Pure white (#ffffff) for backgrounds
- **Grays**: Carefully selected gray scale for text and borders
- **Accents**: Minimal use of green for call actions, red for end calls

### Typography
- **Font**: System font stack for optimal performance
- **Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)
- **Sizes**: Responsive scale from 12px to 32px

### Spacing
- **System**: 8px base unit for consistent spacing
- **Components**: Standardized padding and margins
- **Layout**: Proper use of whitespace for readability

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hola-audio-call-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

### Demo Credentials

For testing the login functionality:
- **Phone**: +1234567890
- **Password**: password

Or use the Truecaller login option for instant access.

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI elements (Button, Input, Modal, etc.)
│   ├── auth/           # Authentication components
│   ├── contacts/       # Contact management components
│   ├── calls/          # Call-related components
│   ├── messages/       # Messaging components
│   ├── settings/       # Settings components
│   └── layout/         # Layout components (Header, Navigation)
├── hooks/              # Custom React hooks
├── pages/              # Main page components
├── services/           # API services and mock data
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🔧 Backend Integration

The app is designed for easy backend integration:

### API Service Layer
- **Centralized API calls** in `src/services/api.ts`
- **Mock data** easily replaceable with real endpoints
- **Error handling** built into all service methods
- **TypeScript interfaces** for all data structures

### Database Schema
Ready for SQLite/PostgreSQL integration:

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Contacts table
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  avatar TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Call logs table
CREATE TABLE call_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  contact_id TEXT REFERENCES contacts(id),
  type TEXT CHECK(type IN ('incoming', 'outgoing', 'missed')),
  duration INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  contact_id TEXT REFERENCES contacts(id),
  content TEXT NOT NULL,
  is_outgoing BOOLEAN NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Environment Variables
Create a `.env` file for backend configuration:

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_TRUECALLER_APP_KEY=your_truecaller_key
VITE_UPLOAD_ENDPOINT=/upload
```

## 🎨 Customization

### Theming
Modify `tailwind.config.js` to customize colors, spacing, and animations:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#000000',    // Change primary color
      secondary: '#ffffff',  // Change secondary color
    },
    animation: {
      'custom-pulse': 'pulse 2s infinite',
    }
  }
}
```

### Components
All components are modular and easily customizable:
- **Button variants**: Primary, secondary, ghost
- **Input types**: Text, password, tel with validation
- **Modal system**: Backdrop blur, animations
- **Avatar system**: Fallbacks, online indicators

## 📱 Mobile Optimization

- **Touch-friendly**: 44px minimum touch targets
- **Safe areas**: Proper handling of notches and home indicators
- **Responsive breakpoints**: Mobile-first design approach
- **Performance**: Optimized animations and lazy loading
- **PWA ready**: Service worker and manifest configuration

## 🔒 Security Features

- **Input validation**: Client-side and server-ready validation
- **XSS protection**: Sanitized user inputs
- **Authentication**: Secure token-based auth ready
- **Privacy**: No data collection, local storage only

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Pexels** for demo avatar images
- **Lucide** for beautiful icons
- **Framer Motion** for smooth animations
- **Tailwind CSS** for utility-first styling

---

**Built with ❤️ for modern communication**

## Links
https://netcatsolutions.ng/sip-trunk-service/?utm_source=chatgpt.com