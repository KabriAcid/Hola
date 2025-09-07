import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Phone, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface RegisterFormProps {
  onRegister: (name: string, phone: string, password: string) => Promise<void>;
  isLoading: boolean;
  onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onRegister,
  isLoading,
  onSwitchToLogin,
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

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

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onRegister(formData.name, formData.phone, formData.password);
      navigate("/app/calls");
    } catch (error) {
      setErrors({ general: "Registration failed. Please try again." });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto p-6"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-black mb-2">Join Hola</h1>
        <p className="text-gray-600">Create your account to get started</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.currentTarget.value })
          }
          error={errors.name}
          icon={<User className="w-5 h-5" />}
        />

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
            placeholder="Create a password"
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

        <div className="relative">
          <Input
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({
                ...formData,
                confirmPassword: e.currentTarget.value,
              })
            }
            error={errors.confirmPassword}
            icon={<Lock className="w-5 h-5" />}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? (
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
          Create Account
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-black font-medium hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </motion.div>
  );
};
