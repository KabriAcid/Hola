import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Phone, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { LoginMethod } from "../../types";

interface LoginFormProps {
  onLogin: (phone: string, password: string) => Promise<void>;
  onTruecallerLogin: () => Promise<void>;
  isLoading: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  onTruecallerLogin,
  isLoading,
}) => {
  const navigate = useNavigate();

  // ...existing code...

  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("phone");

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onLogin(formData.phone, formData.password);
      navigate("/app/calls");
    } catch (error) {
      setErrors({ general: "Invalid phone number or password" });
    }
  };

  const handleTruecallerLogin = async () => {
    try {
      await onTruecallerLogin();
    } catch (error) {
      setErrors({ general: "Truecaller login failed" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto p-6"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Welcome to Hola</h1>
        <p className="text-gray-600">Sign in to start calling</p>
      </div>

      {/* Login Method Toggle */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setLoginMethod("phone")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            loginMethod === "phone"
              ? "bg-white text-black shadow-sm"
              : "text-gray-600"
          }`}
        >
          Phone
        </button>
        <button
          onClick={() => setLoginMethod("truecaller")}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            loginMethod === "truecaller"
              ? "bg-white text-black shadow-sm"
              : "text-gray-600"
          }`}
        >
          Truecaller
        </button>
      </div>

      {loginMethod === "phone" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+1 234 567 8900"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.currentTarget.value })
            }
            error={errors.phone}
            icon={<Phone className="w-5 h-5" />}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.currentTarget.value })
              }
              error={errors.password}
              icon={<Lock className="w-5 h-5" />}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {errors.general && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-600 text-sm text-center"
            >
              {errors.general}
            </motion.p>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Sign In
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Sign in with Truecaller
            </h3>
            <p className="text-gray-600 text-sm">
              Verify your phone number instantly with Truecaller
            </p>
          </div>

          {errors.general && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-600 text-sm text-center"
            >
              {errors.general}
            </motion.p>
          )}

          <Button
            onClick={handleTruecallerLogin}
            className="w-full"
            isLoading={isLoading}
          >
            Continue with Truecaller
          </Button>
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-black font-medium hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </motion.div>
  );
};
