import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { User, Phone, Camera } from "lucide-react";
import { Contact } from "../../types";

// Extend Contact for form submission to allow avatarFile
type ContactFormData = Omit<Contact, "id"> & { avatarFile?: File };
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Avatar } from "../ui/Avatar";

interface ContactFormProps {
  isOpen: boolean;
  contact?: Contact;
  onSave: (contact: ContactFormData) => Promise<void>;
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
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    avatar: string;
    email: string;
    avatarFile?: File;
    avatarPreview?: string; // For showing the preview without affecting the original avatar
  }>({
    name: contact?.name || "",
    phone: contact?.phone || "",
    avatar: contact?.avatar || "",
    email: contact?.email || "",
    avatarFile: undefined,
    avatarPreview: undefined,
  });

  // Reset form when contact prop changes (for edit mode)
  React.useEffect(() => {
    setFormData({
      name: contact?.name || "",
      phone: contact?.phone || "",
      avatar: contact?.avatar || "",
      email: contact?.email || "",
      avatarFile: undefined,
      avatarPreview: undefined,
    });
  }, [contact, isOpen]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Nigerian phone number regex (must start with 080, 081, 070, or 090 and be 11 digits)
  const nigerianPhoneRegex = /^0(70|80|81|90)\d{8}$/;
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
        "Phone must start with 080, 081, 070, or 090 and be 11 digits (e.g. 08012345678)";
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
          "Phone must start with 080, 081, 070, or 090 and be 11 digits (e.g. 08012345678)",
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
        avatarFile: formData.avatarFile,
        email: formData.email.trim(),
        isFavorite: contact ? contact.isFavorite : false, // Explicitly false for new contacts
        isOnline: contact?.isOnline || false,
      });
      // Note: onClose() is handled by the parent component after successful save
    } catch (error) {
      // Show backend error if available
      console.error("[ContactForm] Error in handleSubmit:", error);
      if (error && (error as any).message) {
        setErrors({ general: (error as any).message });
      } else {
        setErrors({ general: "Failed to save contact" });
      }
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, avatarFile: file }));
      // Show a preview using base64 for the Avatar component
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData((prev) => ({
          ...prev,
          avatarPreview: ev.target?.result as string,
        }));
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
              <Avatar
                src={formData.avatarPreview || formData.avatar}
                alt={formData.name}
                size="xl"
              />
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
          name="phone_number"
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

        <div className="flex justify-between space-x-2 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="hover:bg-gray-300 border-gray-200"
          >
            Cancel
          </Button>
          <Button type="submit" className="w-full" isLoading={isLoading}>
            {contact ? "Update" : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
