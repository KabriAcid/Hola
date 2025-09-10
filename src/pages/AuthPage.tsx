import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const location = useLocation();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // If already authenticated, don't render auth forms (App.tsx will redirect)
  if (isAuthenticated) return null;

  const handleLogin = async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      await login(phone, password);
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
      // For demo, treat Truecaller login as phone login
      await login(user.phone, "truecaller");
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

  // Only allow '000000' as the valid code
  const handleVerification = async (code: string) => {
    if (!pendingUser) return false;
    if (code === "000000") {
      // Simulate login after verification
      try {
        await apiService.register(
          pendingUser.name,
          pendingUser.phone,
          pendingUser.password
        );
        await handleLogin(pendingUser.phone, pendingUser.password);
        setPendingUser(null);
        setShowVerification(false);
      } catch (error) {
        return false;
      }
      navigate("/");
      return true;
    }
    return false;
  };

  // Determine which form to show based on location.pathname
  const isRegister = location.pathname.endsWith("register");

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {isRegister ? (
            <motion.div
              key="register"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <RegisterForm
                onRegister={handleRegister}
                onSwitchToLogin={() => navigate("/login")}
                isLoading={isLoading}
              />
            </motion.div>
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <LoginForm
                onLogin={handleLogin}
                onTruecallerLogin={handleTruecallerLogin}
                onSwitchToRegister={() => navigate("/register")}
                isLoading={isLoading}
              />
            </motion.div>
          )}
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
