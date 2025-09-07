import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "./hooks/useAuth";
import { AuthPage } from "./pages/AuthPage";
import { MainApp } from "./pages/MainApp";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";

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
          <Routes>
            {/* Public route for authentication */}
            <Route
              path="/"
              element={
                !isAuthenticated ? (
                  <AuthPage key="auth-page" />
                ) : (
                  <Navigate to="/app" replace />
                )
              }
            />
            {/* Protected main app route */}
            <Route
              path="/app/*"
              element={
                isAuthenticated ? (
                  <MainApp key="main-app" />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            {/* 404 fallback */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center text-gray-500">
                  404 - Page Not Found
                </div>
              }
            />
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;
