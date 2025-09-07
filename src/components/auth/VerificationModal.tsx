import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface VerificationModalProps {
  isOpen: boolean;
  phone: string;
  onVerify: (code: string) => Promise<boolean>;
  onClose: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  phone,
  onVerify,
  onClose,
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (isOpen && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, timeLeft]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');
    if (verificationCode.length !== 6) {
      setError('Please enter the complete verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const isValid = await onVerify(verificationCode);
      if (isValid) {
        onClose();
      } else {
        setError('Invalid verification code');
      }
    } catch (error) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    setTimeLeft(60);
    setCode(['', '', '', '', '', '']);
    setError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Verify Your Phone</h2>
        <p className="text-gray-600 mb-6">
          We've sent a verification code to<br />
          <span className="font-medium">{phone}</span>
        </p>

        <div className="flex justify-center space-x-3 mb-6">
          {code.map((digit, index) => (
            <motion.input
              key={index}
              id={`code-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-200 rounded-lg focus:border-black transition-colors"
              whileFocus={{ scale: 1.05 }}
            />
          ))}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-600 text-sm mb-4"
          >
            {error}
          </motion.p>
        )}

        <Button
          onClick={handleVerify}
          className="w-full mb-4"
          isLoading={isLoading}
        >
          Verify Code
        </Button>

        <div className="text-center">
          {timeLeft > 0 ? (
            <p className="text-gray-600 text-sm">
              Resend code in {timeLeft}s
            </p>
          ) : (
            <button
              onClick={handleResend}
              className="text-black font-medium text-sm hover:underline"
            >
              Resend verification code
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};