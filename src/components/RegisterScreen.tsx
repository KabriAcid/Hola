import React, { useState } from "react";
import { motion } from "framer-motion";
import { Phone, ArrowLeft, Shield, CheckCircle } from "lucide-react";
import { RegisterMethod } from "../types";

interface RegisterScreenProps {
  onBack: () => void;
  onRegister: (method: RegisterMethod, data: string) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onBack,
  onRegister,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<RegisterMethod | null>(
    null
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTruecallerRegister = async () => {
    setIsLoading(true);
    // Simulate Truecaller verification
    setTimeout(() => {
      onRegister("truecaller", "truecaller_verified");
    }, 2000);
  };

  const handlePhoneRegister = async () => {
    if (!phoneNumber.trim()) return;
    setIsLoading(true);
    // Simulate phone verification
    setTimeout(() => {
      onRegister("phone", phoneNumber);
    }, 2000);
  };

  if (selectedMethod === "phone") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white min-h-screen p-6"
      >
        <div className="max-w-md mx-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedMethod(null)}
            className="mb-8 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </motion.button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Enter your phone number
            </h2>
            <p className="text-gray-600">We'll send you a verification code</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePhoneRegister}
              disabled={!phoneNumber.trim() || isLoading}
              className="w-full bg-primary-500 text-white py-4 rounded-xl font-semibold text-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending code...</span>
                </div>
              ) : (
                "Send verification code"
              )}
            </motion.button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white min-h-screen p-6"
    >
      <div className="max-w-md mx-auto">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="mb-8 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </motion.button>

        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Phone className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Welcome to Hola
          </h1>
          <p className="text-gray-600 text-lg">
            Choose how you'd like to get started
          </p>
        </div>

        <div className="space-y-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleTruecallerRegister}
            disabled={isLoading}
            className="w-full bg-accent-blue-500 text-white p-6 rounded-2xl font-semibold text-lg hover:bg-accent-blue-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying with Truecaller...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-3">
                <Shield className="w-6 h-6" />
                <span>Continue with Truecaller</span>
                <CheckCircle className="w-5 h-5" />
              </div>
            )}
          </motion.button>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedMethod("phone")}
            className="w-full border-2 border-gray-200 text-gray-700 py-4 rounded-2xl font-semibold text-lg hover:border-gray-500 transition-all"
          >
            <div className="flex items-center justify-center space-x-3">
              <Phone className="w-6 h-6" />
              <span>Continue with phone number</span>
            </div>
          </motion.button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-8">
          By continuing, you agree to our{" "}
          <span className="text-primary-600 underline">Terms of Service</span>{" "}
          and <span className="text-primary-600 underline">Privacy Policy</span>
        </p>
      </div>
    </motion.div>
  );
};
