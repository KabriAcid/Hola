import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { User, Phone, Camera } from "lucide-react";
import { Contact } from "../../types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Avatar } from "../ui/Avatar";

interface ContactFormProps {
  isOpen: boolean;
  contact?: Contact;
  onSave: (contact: Omit<Contact, "id">) => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  isOpen,
  contact,
  onSave,
  onClose,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: contact?.name || "",
    phone: contact?.phone || "",
    avatar: contact?.avatar || "",
    email: contact?.email || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Nigerian phone number regex (same as registration backend: isMobilePhone('en-NG'))
  const nigerianPhoneRegex = /^(\+234|0)[789][01]\d{8}$/;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!nigerianPhoneRegex.test(formData.phone.trim())) {
      newErrors.phone =
        "Enter a valid Nigerian phone number (e.g. 08012345678 or +2348012345678)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time phone validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, phone: value });
    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, phone: "Phone number is required" }));
    } else if (!nigerianPhoneRegex.test(value.trim())) {
      setErrors((prev) => ({
        ...prev,
        phone:
          "Enter a valid Nigerian phone number (e.g. 08012345678 or +2348012345678)",
      }));
    } else {
      setErrors((prev) => {
        const { phone, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      // If avatar is empty, use the default avatar filename
      const avatarValue = formData.avatar?.trim()
        ? formData.avatar
        : "default.png";
      await onSave({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        avatar: avatarValue,
        email: formData.email.trim(),
        isFavorite: contact?.isFavorite || false,
        isOnline: contact?.isOnline || false,
      });
      onClose();
    } catch (error) {
      setErrors({ general: "Failed to save contact" });
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({ ...formData, avatar: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={contact ? "Edit Contact" : "Add Contact"}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div onClick={handleAvatarClick} className="cursor-pointer">
              <Avatar src={formData.avatar} alt={formData.name} size="xl" />
            </div>
            <motion.button
              type="button"
              onClick={handleAvatarClick}
              className="absolute -bottom-2 -right-2 bg-black text-white p-2 rounded-full shadow-lg"
              whileTap={{ scale: 0.95 }}
            >
              <Camera className="w-4 h-4" />
            </motion.button>
          </div>
          <p className="text-sm text-gray-600 mt-2">Tap to change photo</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <Input
          label="Name"
          type="text"
          placeholder="Enter contact name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          icon={<User className="w-5 h-5" />}
        />

        <Input
          label="Phone Number"
          type="tel"
          maxLength={11}
          placeholder="08012345678 or +2348012345678"
          value={formData.phone}
          onChange={handlePhoneChange}
          error={errors.phone}
          icon={<Phone className="w-5 h-5" />}
        />

        <Input
          label="Email"
          type="email"
          placeholder="Enter email address"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={errors.email}
        />

        {/* Removed Label and Notes fields as per schema update */}

        {errors.general && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-600 text-sm text-center"
          >
            {errors.general}
          </motion.p>
        )}

        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={isLoading}>
            {contact ? "Update" : "Add"} Contact
          </Button>
        </div>
      </form>
    </Modal>
  );
};
