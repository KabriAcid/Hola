import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "./hooks/useAuth";
import { MainApp } from "./pages/MainApp";
import { LogoutPage } from "./pages/LogoutPage";
import NotFound from "./pages/ErrorPage";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import AuthPage from "./pages/AuthPage";

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
            {/* Auth & public routes */}
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/app/calls" replace />
                ) : (
                  <AuthPage />
                )
              }
            />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/logout" element={<LogoutPage />} />
            {/* Main app route (protected) */}
            <Route
              path="/app/*"
              element={
                isAuthenticated ? (
                  <MainApp key="main-app" />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            {/* Redirect / to /login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            {/* 404 fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;
