import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Settings, Users, LogOut, Shield, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const { logout, isAdmin } = useAuth();

  const navItems = [
    { path: '/dashboard', icon: Home, label: t('navigation.home') },
    { path: '/dashboard/configurations', icon: Settings, label: t('navigation.configurations') },
    { path: '/dashboard/teams', icon: Users, label: t('navigation.teams') },
    { path: '/dashboard/profile', icon: User, label: t('navigation.profile') },
    ...(isAdmin ? [{ path: '/dashboard/admin', icon: Shield, label: t('navigation.admin') }] : []),
  ];

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-64 bg-white dark:bg-gray-900 shadow-xl h-screen flex flex-col border-r border-gray-200 dark:border-gray-700"
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <img 
            src="/public/CALYPSO_LOGO_TRANSP.png" 
            alt="Calypso" 
            className="w-10 h-10"
          />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Calypso
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={logout}
          className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t('common.logout')}</span>
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;