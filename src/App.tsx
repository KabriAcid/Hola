import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import { AuthPage } from './pages/AuthPage';
import { MainApp } from './pages/MainApp';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <AnimatePresence mode="wait">
          {isAuthenticated ? (
            <MainApp key="main-app" />
          ) : (
            <AuthPage key="auth-page" />
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;