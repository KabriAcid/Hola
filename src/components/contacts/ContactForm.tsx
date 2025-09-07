import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Camera } from 'lucide-react';
import { Contact } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';

interface ContactFormProps {
  isOpen: boolean;
  contact?: Contact;
  onSave: (contact: Omit<Contact, 'id'>) => Promise<void>;
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
    name: contact?.name || '',
    phone: contact?.phone || '',
    avatar: contact?.avatar || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      await onSave({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        avatar: formData.avatar,
        isFavorite: contact?.isFavorite || false,
        isOnline: contact?.isOnline || false,
      });
      onClose();
    } catch (error) {
      setErrors({ general: 'Failed to save contact' });
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
      title={contact ? 'Edit Contact' : 'Add Contact'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar
              src={formData.avatar}
              alt={formData.name}
              size="xl"
              className="cursor-pointer"
              onClick={handleAvatarClick}
            />
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
          placeholder="+1 234 567 8900"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          error={errors.phone}
          icon={<Phone className="w-5 h-5" />}
        />

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
          <Button
            type="submit"
            className="flex-1"
            isLoading={isLoading}
          >
            {contact ? 'Update' : 'Add'} Contact
          </Button>
        </div>
      </form>
    </Modal>
  );
};