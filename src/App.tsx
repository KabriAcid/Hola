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
import NotFound from "./pages/ErrorPage";
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
            {/* Public routes for authentication */}
            <Route path="*" element={<NotFound />} />
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="/register" element={<Navigate to="/app" replace />} />
            {/* Protected main app route */}
            <Route path="/app/*" element={<MainApp key="main-app" />} />
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
