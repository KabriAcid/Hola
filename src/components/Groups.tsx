import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Users } from 'lucide-react';
import { Group } from '../types';

interface GroupsProps {
  groups: Group[];
  onGroupClick: (group: Group) => void;
}

export const Groups: React.FC<GroupsProps> = ({ groups, onGroupClick }) => {
  const getGroupBgColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-primary-100 text-primary-700';
      case 'pink':
        return 'bg-accent-pink-100 text-accent-pink-700';
      case 'blue':
        return 'bg-accent-blue-100 text-accent-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getGroupIcon = (group: Group) => {
    if (group.isNewGroup) {
      return <Plus className="w-8 h-8" />;
    }
    return <Users className="w-8 h-8" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white h-full p-6"
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Groups</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        {groups.map((group, index) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onGroupClick(group)}
            className={`${getGroupBgColor(group.color)} rounded-2xl p-6 cursor-pointer relative overflow-hidden group transition-all duration-200 hover:shadow-md`}
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="mb-4"
            >
              {getGroupIcon(group)}
            </motion.div>
            
            <h3 className="font-semibold text-lg mb-1">{group.name}</h3>
            {!group.isNewGroup && (
              <p className="text-sm opacity-80">{group.memberCount} members</p>
            )}
            
            {/* Decorative circles */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-white bg-opacity-30 rounded-full" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};