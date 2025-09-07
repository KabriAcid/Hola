import React from "react";
import {
  Routes,
  Route,
  useNavigate,
  useLocation,
  Navigate,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LoginForm } from "../components/auth/LoginForm";
import { RegisterForm } from "../components/auth/RegisterForm";
import { VerificationModal } from "../components/auth/VerificationModal";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";

export const AuthPage: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [showVerification, setShowVerification] = React.useState(false);
  const [pendingUser, setPendingUser] = React.useState<{
    name: string;
    phone: string;
    password: string;
  } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleLogin = async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      const user = await apiService.login(phone, password);
      login(user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleTruecallerLogin = async () => {
    setIsLoading(true);
    try {
      const user = await apiService.truecallerLogin();
      login(user);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (
    name: string,
    phone: string,
    password: string
  ) => {
    setIsLoading(true);
    try {
      await apiService.register(name, phone, password);
      setPendingUser({ name, phone, password });
      setShowVerification(true);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (code: string) => {
    if (!pendingUser) return false;

    try {
      const isValid = await apiService.verifyCode(pendingUser.phone, code);
      if (isValid) {
        const user = await apiService.register(
          pendingUser.name,
          pendingUser.phone,
          pendingUser.password
        );
        login(user);
        setPendingUser(null);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route
              index
              element={
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <LoginForm
                    onLogin={handleLogin}
                    onTruecallerLogin={handleTruecallerLogin}
                    onSwitchToRegister={() => navigate("/register")}
                    isLoading={isLoading}
                  />
                </motion.div>
              }
            />
            <Route
              path="register"
              element={
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <RegisterForm
                    onRegister={handleRegister}
                    onSwitchToLogin={() => navigate("/")}
                    isLoading={isLoading}
                  />
                </motion.div>
              }
            />
            {/* fallback to login for unknown auth routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>

      <VerificationModal
        isOpen={showVerification}
        phone={pendingUser?.phone || ""}
        onVerify={handleVerification}
        onClose={() => {
          setShowVerification(false);
          setPendingUser(null);
        }}
      />
    </div>
  );
};
