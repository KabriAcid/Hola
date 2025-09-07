import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Plus, MoreVertical } from 'lucide-react';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showSearch?: boolean;
  showAdd?: boolean;
  showMore?: boolean;
  onBack?: () => void;
  onSearch?: () => void;
  onAdd?: () => void;
  onMore?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  showSearch = false,
  showAdd = false,
  showMore = false,
  onBack,
  onSearch,
  onAdd,
  onMore,
}) => {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between safe-area-top"
    >
      <div className="flex items-center">
        {showBack && (
          <motion.button
            onClick={onBack}
            className="p-2 -ml-2 mr-2 hover:bg-gray-100 rounded-full transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
        )}
        <h1 className="text-xl font-semibold text-black">{title}</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        {showSearch && (
          <motion.button
            onClick={onSearch}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Search className="w-6 h-6" />
          </motion.button>
        )}
        
        {showAdd && (
          <motion.button
            onClick={onAdd}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-6 h-6" />
          </motion.button>
        )}
        
        {showMore && (
          <motion.button
            onClick={onMore}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <MoreVertical className="w-6 h-6" />
          </motion.button>
        )}
      </div>
    </motion.header>
  );
};