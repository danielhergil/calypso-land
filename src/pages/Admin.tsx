import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, Clock, Video, Monitor, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../firebase/services';
import toast from 'react-hot-toast';
import MetricCard from '../components/Dashboard/MetricCard';

interface UserWithMetrics {
  id: string;
  email: string;
  role?: string;
  createdAt: unknown;
  totalStreamTime: number;
  totalRecordingTime: number;
  numberOfTeams: number;
}

interface AdminMetrics {
  totalUsers: number;
  totalStreamTime: number;
  totalRecordingTime: number;
  averageStreamTime: number;
}

const Admin: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin, user } = useAuth();
  const [users, setUsers] = useState<UserWithMetrics[]>([]);
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics>({
    totalUsers: 0,
    totalStreamTime: 0,
    totalRecordingTime: 0,
    averageStreamTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }
    
    loadAdminData();
  }, [isAdmin]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const usersWithMetrics = await firestoreService.getAllUsersWithMetrics();
      setUsers(usersWithMetrics);

      const totalUsers = usersWithMetrics.length;
      const totalStreamTime = Math.floor(usersWithMetrics.reduce((acc, user) => acc + user.totalStreamTime, 0));
      const totalRecordingTime = Math.floor(usersWithMetrics.reduce((acc, user) => acc + user.totalRecordingTime, 0));
      const averageStreamTime = totalUsers > 0 ? Math.floor(totalStreamTime / totalUsers) : 0;

      setAdminMetrics({
        totalUsers,
        totalStreamTime,
        totalRecordingTime,
        averageStreamTime
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('admin.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('admin.subtitle')}
        </p>
      </motion.div>

      {/* Admin Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title={t('admin.metrics.totalUsers')}
          value={adminMetrics.totalUsers}
          icon={Users}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          delay={0.1}
        />
        <MetricCard
          title={t('admin.metrics.totalStreamTime')}
          value={formatTime(adminMetrics.totalStreamTime)}
          icon={Video}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          delay={0.2}
        />
        <MetricCard
          title={t('admin.metrics.totalRecordingTime')}
          value={formatTime(adminMetrics.totalRecordingTime)}
          icon={Monitor}
          color="bg-gradient-to-r from-green-500 to-green-600"
          delay={0.3}
        />
        <MetricCard
          title={t('admin.metrics.averageStreamTime')}
          value={formatTime(adminMetrics.averageStreamTime)}
          icon={Clock}
          color="bg-gradient-to-r from-orange-500 to-orange-600"
          delay={0.4}
        />
      </div>

      {/* User Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('admin.userManagement.title')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View all registered users and their activity statistics
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400">{t('admin.userManagement.email')}</th>
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400">{t('admin.userManagement.role')}</th>
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400">Stream Time</th>
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400">Recording Time</th>
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400">Teams</th>
                <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400">{t('admin.userManagement.createdAt')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userData) => (
                <tr key={userData.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="py-3 px-4 text-gray-900 dark:text-white">{userData.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      userData.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {userData.role === 'admin' ? t('admin.userManagement.roles.admin') : t('admin.userManagement.roles.user')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">{formatTime(userData.totalStreamTime)}</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">{formatTime(userData.totalRecordingTime)}</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white">{userData.numberOfTeams}</td>
                  <td className="py-3 px-4 text-gray-900 dark:text-white text-sm">
                    {userData.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Admin;