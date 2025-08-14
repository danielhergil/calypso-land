import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Video, Users, Settings, Wifi, Monitor } from 'lucide-react';
import { motion } from 'framer-motion';
import MetricCard from '../components/Dashboard/MetricCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();

  // Mock data - replace with real data from Firestore
  const metrics = {
    totalStreamTime: '24h 32m',
    lastStreamTime: '2h 15m',
    totalRecordingTime: '18h 45m',
    lastRecordingTime: '1h 30m',
    numberOfTeams: 5,
    lastStreamConfig: {
      rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
      fps: 30,
      resolution: '1080p',
      bitrate: '15 Mbps'
    }
  };

  const streamData = [
    { name: 'Mon', hours: 4 },
    { name: 'Tue', hours: 6 },
    { name: 'Wed', hours: 3 },
    { name: 'Thu', hours: 8 },
    { name: 'Fri', hours: 5 },
    { name: 'Sat', hours: 7 },
    { name: 'Sun', hours: 4 },
  ];

  const performanceData = [
    { name: '00:00', bitrate: 15, fps: 30 },
    { name: '04:00', bitrate: 14.8, fps: 30 },
    { name: '08:00', bitrate: 15.2, fps: 30 },
    { name: '12:00', bitrate: 15.1, fps: 29 },
    { name: '16:00', bitrate: 14.9, fps: 30 },
    { name: '20:00', bitrate: 15.3, fps: 30 },
  ];

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('home.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's your streaming overview.
        </p>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title={t('home.totalStreamTime')}
          value={metrics.totalStreamTime}
          icon={Clock}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          delay={0.1}
        />
        <MetricCard
          title={t('home.lastStreamTime')}
          value={metrics.lastStreamTime}
          icon={Video}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          delay={0.2}
        />
        <MetricCard
          title={t('home.totalRecordingTime')}
          value={metrics.totalRecordingTime}
          icon={Monitor}
          color="bg-gradient-to-r from-green-500 to-green-600"
          delay={0.3}
        />
        <MetricCard
          title={t('home.lastRecordingTime')}
          value={metrics.lastRecordingTime}
          icon={Clock}
          color="bg-gradient-to-r from-orange-500 to-orange-600"
          delay={0.4}
        />
        <MetricCard
          title={t('home.numberOfTeams')}
          value={metrics.numberOfTeams}
          icon={Users}
          color="bg-gradient-to-r from-pink-500 to-pink-600"
          delay={0.5}
        />
        <MetricCard
          title="Active Streams"
          value="2"
          icon={Wifi}
          color="bg-gradient-to-r from-red-500 to-red-600"
          delay={0.6}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Stream Hours */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Weekly Stream Hours
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={streamData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Bar dataKey="hours" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Stream Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="bitrate" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="fps" 
                stroke="#F59E0B" 
                strokeWidth={3}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Last Stream Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-blue-500" />
          {t('home.lastStreamConfig')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('home.rtmpUrl')}</p>
            <p className="font-mono text-sm text-gray-900 dark:text-white truncate">
              {metrics.lastStreamConfig.rtmpUrl}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('home.fps')}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {metrics.lastStreamConfig.fps}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('home.resolution')}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {metrics.lastStreamConfig.resolution}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('home.bitrate')}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {metrics.lastStreamConfig.bitrate}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;