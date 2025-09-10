import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LoginForm } from "../components/auth/LoginForm";
import { RegisterForm } from "../components/auth/RegisterForm";
import { VerificationModal } from "../components/auth/VerificationModal";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

const AuthPage: React.FC = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showOverlay, setShowOverlay] = React.useState(false);
  // Restore verification state from localStorage if present, but only show modal on /register
  const isRegister = location.pathname.endsWith("register");
  const [showVerification, setShowVerification] = React.useState(() => {
    return (
      isRegister && localStorage.getItem("hola_showVerification") === "true"
    );
  });
  const [pendingPhone, setPendingPhone] = React.useState<string | null>(() => {
    return isRegister
      ? localStorage.getItem("hola_pendingPhone") || null
      : null;
  });
  const [registrationCode, setRegistrationCode] = React.useState<string | null>(
    () => {
      return isRegister
        ? localStorage.getItem("hola_registrationCode") || null
        : null;
    }
  );
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // If already authenticated, don't render auth forms (App.tsx will redirect)
  if (isAuthenticated) return null;

  const handleLogin = async (phone: string, password: string) => {
    setIsLoading(true);
    try {
      await login(phone, password);
      navigate("/app/calls");
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
      // Generate a random 6-digit code for demo (in real app, backend should send this)
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await apiService.register(name, phone, password);
      setPendingPhone(phone);
      setRegistrationCode(code);
      setShowOverlay(true);
      // Show overlay for 2 seconds before showing verification modal
      setTimeout(() => {
        setShowOverlay(false);
        setShowVerification(true);
      }, 2000);
      localStorage.setItem("hola_showVerification", "true");
      localStorage.setItem("hola_pendingPhone", phone);
      localStorage.setItem("hola_registrationCode", code);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Verify code with backend
  const handleVerification = async (code: string) => {
    if (!pendingPhone) return false;
    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: pendingPhone, code }),
      });
      if (!response.ok) return false;
      // On success, clear state and redirect to login
      setPendingPhone(null);
      setRegistrationCode(null);
      setShowVerification(false);
      localStorage.removeItem("hola_showVerification");
      localStorage.removeItem("hola_pendingPhone");
      localStorage.removeItem("hola_registrationCode");
      navigate("/login");
      return true;
    } catch (error) {
      return false;
    }
  };

  // ...existing code...

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Overlay with loading spinner */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="flex flex-col items-center">
            <LoadingSpinner size="lg" />
            <span className="mt-4 text-white text-lg font-semibold">
              Creating your account...
            </span>
          </div>
        </div>
      )}
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

      {/* Only show VerificationModal if on register page and verification state is set */}
      <VerificationModal
        isOpen={isRegister && showVerification}
        phone={pendingPhone || ""}
        onVerify={handleVerification}
        onClose={async () => {
          // Call backend to delete pending registration if code exists
          if (registrationCode) {
            try {
              await fetch(`/api/pending-registration/${registrationCode}`, {
                method: "DELETE",
              });
            } catch (e) {
              // Ignore errors
            }
          }
          setShowVerification(false);
          setPendingPhone(null);
          setRegistrationCode(null);
          localStorage.removeItem("hola_showVerification");
          localStorage.removeItem("hola_pendingPhone");
          localStorage.removeItem("hola_registrationCode");
        }}
      />
    </div>
  );
};

export default AuthPage;
