import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Star } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'recents' as TabType, label: 'Recents', icon: Clock },
    { id: 'contacts' as TabType, label: 'Contacts', icon: Users },
    { id: 'groups' as TabType, label: 'Groups', icon: Star },
  ];

  return (
    <div className="bg-white border-t border-gray-100 px-6 py-3">
      <div className="flex justify-between items-center">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg transition-colors ${
                isActive ? 'text-accent-blue-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <motion.div
                whileHover={{ y: -1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <IconComponent className="w-5 h-5" />
              </motion.div>
              <span className="text-xs font-medium">{tab.label}</span>
              
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="w-1 h-1 bg-accent-blue-500 rounded-full"
                  transition={{ type: "spring", stiffness: 300 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};