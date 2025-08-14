import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Settings, Video, Mic, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';
import { StreamProfile } from '../types';

const Configurations: React.FC = () => {
  const { t } = useTranslation();
  
  // Mock data - replace with real data from Firestore
  const [profiles, setProfiles] = useState<StreamProfile[]>([
    {
      alias: "TLFN",
      audioSettings: {},
      bitrateKbps: 160,
      source: "Device Audio",
      connections: [
        {
          alias: "MIGUEL",
          full_url: "rtmp://a.rtmp.youtube.com/live2/m14a-4tmq-pw1x-2m51-46ps",
          rtmp_url: "rtmp://a.rtmp.youtube.com/live2",
          streamkey: "m14a-4tmq-pw1x-2m51-46ps"
        }
      ],
      recordSettings: {
        bitrateMbps: 25,
        resolution: "1080p"
      },
      selectedConnectionAlias: "MIGUEL",
      videoSettings: {
        bitrateMbps: 15,
        codec: "H265",
        fps: 30,
        resolution: "1080p",
        source: "Device Camera"
      }
    }
  ]);

  const [selectedProfile, setSelectedProfile] = useState<StreamProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddProfile = () => {
    setSelectedProfile(null);
    setIsModalOpen(true);
  };

  const handleEditProfile = (profile: StreamProfile) => {
    setSelectedProfile(profile);
    setIsModalOpen(true);
  };

  const handleDeleteProfile = (alias: string) => {
    setProfiles(profiles.filter(p => p.alias !== alias));
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('configurations.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your streaming and recording profiles
          </p>
        </div>
        <button
          onClick={handleAddProfile}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span>{t('configurations.addProfile')}</span>
        </button>
      </motion.div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {profiles.map((profile, index) => (
          <motion.div
            key={profile.alias}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{profile.alias}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditProfile(profile)}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <Edit className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => handleDeleteProfile(profile.alias)}
                    className="p-2 bg-white/20 rounded-lg hover:bg-red-500/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-4">
              {/* Video Settings */}
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {t('configurations.videoSettings')}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Resolution:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {profile.videoSettings.resolution}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">FPS:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {profile.videoSettings.fps}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Codec:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {profile.videoSettings.codec}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Bitrate:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {profile.videoSettings.bitrateMbps} Mbps
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Audio Settings */}
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Mic className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {t('configurations.audioSettings')}
                  </h4>
                  <div className="text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Source:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {profile.source}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Bitrate:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {profile.bitrateKbps} Kbps
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connection */}
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Wifi className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {t('configurations.connections')}
                  </h4>
                  <div className="text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Active:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {profile.selectedConnectionAlias}
                      </span>
                    </div>
                    <div className="mt-1">
                      <span className="text-gray-600 dark:text-gray-400">RTMP:</span>
                      <span className="ml-1 font-mono text-xs text-gray-900 dark:text-white truncate block">
                        {profile.connections[0]?.rtmp_url}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Record Settings */}
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Settings className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {t('configurations.recordSettings')}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Resolution:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {profile.recordSettings.resolution}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Bitrate:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {profile.recordSettings.bitrateMbps} Mbps
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {profiles.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No configurations yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create your first streaming profile to get started
          </p>
          <button
            onClick={handleAddProfile}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            {t('configurations.addProfile')}
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default Configurations;