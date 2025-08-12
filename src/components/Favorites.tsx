import React from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { ContactCard } from "./ContactCard";
import { Contact } from "../types";

interface FavoritesProps {
  favorites: Contact[];
  onContactClick: (contact: Contact) => void;
  onAddFavorite: () => void;
}

export const Favorites: React.FC<FavoritesProps> = ({
  favorites,
  onContactClick,
  onAddFavorite,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Favourites</h2>

      <div className="space-y-2 mb-6">
        {favorites.map((contact, index) => (
          <motion.div
            key={contact.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ContactCard
              contact={contact}
              onClick={() => onContactClick(contact)}
              showFavoriteIcon={true}
              variant="favorite"
            />
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onAddFavorite}
        className="flex items-center space-x-2 text-accent-blue-500 font-medium"
      >
        <div className="w-6 h-6 bg-accent-blue-500 rounded-full flex items-center justify-center">
          <Plus className="w-4 h-4 text-white" />
        </div>
        <span>Add favourite</span>
      </motion.button>
    </motion.div>
  );
};
