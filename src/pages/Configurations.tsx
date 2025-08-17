import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Settings, Video, Mic, Wifi, X, Save, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StreamProfile, Connection } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../firebase/services';

const Configurations: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<StreamProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserProfiles = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userProfiles = await firestoreService.getUserProfiles(user.uid);
        setProfiles(userProfiles);
      } catch (error) {
        console.error('Error loading user profiles');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfiles();
  }, [user]);

  const [selectedProfile, setSelectedProfile] = useState<StreamProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectionsModalProfile, setConnectionsModalProfile] = useState<StreamProfile | null>(null);
  const [isConnectionsModalOpen, setIsConnectionsModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [connectionForm, setConnectionForm] = useState<Connection>({
    alias: '',
    full_url: '',
    rtmp_url: '',
    streamkey: ''
  });
  const [isCreateProfileModalOpen, setIsCreateProfileModalOpen] = useState(false);
  const [newProfileForm, setNewProfileForm] = useState({
    alias: '',
    connectionAlias: '',
    rtmpUrl: '',
    streamKey: '',
    fullUrl: ''
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'profile' | 'connection';
    isOpen: boolean;
    item: { id: string; name: string } | null;
  }>({
    type: 'profile',
    isOpen: false,
    item: null
  });

  const DEFAULT_PROFILE_TEMPLATE = {
    audioSettings: {
      bitrateKbps: 160,
      source: "Device Audio"
    },
    bitrateKbps: 160,
    source: "Device Audio",
    recordSettings: {
      bitrateMbps: 25,
      resolution: "1080p"
    },
    videoSettings: {
      bitrateMbps: 15,
      codec: "H265",
      fps: 30,
      resolution: "1080p",
      source: "Device Camera"
    }
  };

  const handleAddProfile = () => {
    setNewProfileForm({
      alias: '',
      connectionAlias: '',
      rtmpUrl: '',
      streamKey: '',
      fullUrl: ''
    });
    setIsCreateProfileModalOpen(true);
  };

  const handleEditProfile = (profile: StreamProfile) => {
    setSelectedProfile(profile);
    setIsModalOpen(true);
  };

  const handleDeleteProfile = (profileId: string, alias: string) => {
    setDeleteConfirmation({
      type: 'profile',
      isOpen: true,
      item: { id: profileId, name: alias }
    });
  };

  const confirmDeleteProfile = async () => {
    if (!user || !deleteConfirmation.item) return;
    
    try {
      await firestoreService.deleteUserProfile(user.uid, deleteConfirmation.item.id);
      setProfiles(profiles.filter(p => (p as any).id !== deleteConfirmation.item!.id));
      setDeleteConfirmation({ type: 'profile', isOpen: false, item: null });
    } catch (error) {
      console.error('Error deleting profile');
    }
  };

  const handleManageConnections = (profile: StreamProfile) => {
    setConnectionsModalProfile(profile);
    setIsConnectionsModalOpen(true);
  };

  const handleCloseConnectionsModal = () => {
    setIsConnectionsModalOpen(false);
    setShowConnectionForm(false);
    setEditingConnection(null);
    setConnectionForm({
      alias: '',
      full_url: '',
      rtmp_url: '',
      streamkey: ''
    });
  };

  const handleAddConnection = () => {
    setEditingConnection(null);
    setShowConnectionForm(true);
    setConnectionForm({
      alias: '',
      full_url: '',
      rtmp_url: '',
      streamkey: ''
    });
  };

  const handleEditConnection = (connection: Connection) => {
    setEditingConnection(connection);
    setShowConnectionForm(true);
    setConnectionForm({ ...connection });
  };

  const handleSaveConnection = async () => {
    if (!connectionsModalProfile || !user) return;

    const updatedProfile = { ...connectionsModalProfile };
    
    if (editingConnection) {
      const connectionIndex = updatedProfile.connections.findIndex(
        c => c.alias === editingConnection.alias
      );
      if (connectionIndex >= 0) {
        updatedProfile.connections[connectionIndex] = connectionForm;
      }
    } else {
      updatedProfile.connections.push(connectionForm);
    }

    try {
      await firestoreService.updateUserProfile(user.uid, (connectionsModalProfile as any).id, updatedProfile);
      setProfiles(profiles.map(p => 
        (p as any).id === (connectionsModalProfile as any).id ? updatedProfile : p
      ));
      setConnectionsModalProfile(updatedProfile);
      setEditingConnection(null);
      setShowConnectionForm(false);
      setConnectionForm({
        alias: '',
        full_url: '',
        rtmp_url: '',
        streamkey: ''
      });
    } catch (error) {
      console.error('Error saving connection');
    }
  };

  const handleDeleteConnection = (connectionAlias: string) => {
    setDeleteConfirmation({
      type: 'connection',
      isOpen: true,
      item: { id: connectionAlias, name: connectionAlias }
    });
  };

  const confirmDeleteConnection = async () => {
    if (!connectionsModalProfile || !user || !deleteConfirmation.item) return;

    const connectionAlias = deleteConfirmation.item.id;
    const updatedProfile = { ...connectionsModalProfile };
    updatedProfile.connections = updatedProfile.connections.filter(
      c => c.alias !== connectionAlias
    );

    if (updatedProfile.selectedConnectionAlias === connectionAlias) {
      updatedProfile.selectedConnectionAlias = updatedProfile.connections[0]?.alias || '';
    }

    try {
      await firestoreService.updateUserProfile(user.uid, (connectionsModalProfile as any).id, updatedProfile);
      setProfiles(profiles.map(p => 
        (p as any).id === (connectionsModalProfile as any).id ? updatedProfile : p
      ));
      setConnectionsModalProfile(updatedProfile);
      setDeleteConfirmation({ type: 'connection', isOpen: false, item: null });
    } catch (error) {
      console.error('Error deleting connection');
    }
  };

  const handleCreateProfile = async () => {
    if (!user || !newProfileForm.alias || !newProfileForm.connectionAlias || !newProfileForm.rtmpUrl) return;

    const newConnection: Connection = {
      alias: newProfileForm.connectionAlias,
      rtmp_url: newProfileForm.rtmpUrl,
      streamkey: newProfileForm.streamKey,
      full_url: newProfileForm.fullUrl || `${newProfileForm.rtmpUrl}/${newProfileForm.streamKey}`
    };

    const newProfile: StreamProfile = {
      ...DEFAULT_PROFILE_TEMPLATE,
      alias: newProfileForm.alias,
      connections: [newConnection],
      selectedConnectionAlias: newConnection.alias
    };

    try {
      await firestoreService.addUserProfile(user.uid, newProfile);
      const updatedProfiles = await firestoreService.getUserProfiles(user.uid);
      setProfiles(updatedProfiles);
      setIsCreateProfileModalOpen(false);
      setNewProfileForm({
        alias: '',
        connectionAlias: '',
        rtmpUrl: '',
        streamKey: '',
        fullUrl: ''
      });
    } catch (error) {
      console.error('Error creating profile');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your configurations...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Please log in to view your configurations.</p>
        </div>
      </div>
    );
  }

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
                    onClick={() => handleManageConnections(profile)}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                    title="Manage Connections"
                  >
                    <Wifi className="w-4 h-4 text-white" />
                  </button>
                  <button
                    onClick={() => handleDeleteProfile((profile as any).id, profile.alias)}
                    className="p-2 bg-white/20 rounded-lg hover:bg-red-500/50 transition-colors"
                    title="Delete Profile"
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
                    {t('configurations.connections')} ({profile.connections.length})
                  </h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Active:</span>
                      <span className="ml-1 font-medium text-gray-900 dark:text-white">
                        {profile.selectedConnectionAlias}
                      </span>
                    </div>
                    {profile.connections.slice(0, 2).map((conn, idx) => (
                      <div key={conn.alias} className="mt-1">
                        <span className="text-gray-600 dark:text-gray-400">{conn.alias}:</span>
                        <span className="ml-1 font-mono text-xs text-gray-900 dark:text-white truncate block">
                          {conn.rtmp_url}
                        </span>
                      </div>
                    ))}
                    {profile.connections.length > 2 && (
                      <div className="text-gray-500 dark:text-gray-400 text-xs">
                        +{profile.connections.length - 2} more connections
                      </div>
                    )}
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmation.isOpen && deleteConfirmation.item && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
            onClick={() => setDeleteConfirmation({ type: 'profile', isOpen: false, item: null })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Delete {deleteConfirmation.type === 'profile' ? 'Profile' : 'Connection'}
                    </h2>
                    <p className="text-red-100">This action cannot be undone</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Are you sure you want to delete the {deleteConfirmation.type} "
                  <span className="font-semibold">{deleteConfirmation.item.name}</span>"?
                  {deleteConfirmation.type === 'profile' && (
                    <span className="block mt-2 text-sm text-gray-600 dark:text-gray-400">
                      This will permanently remove all associated connections and settings.
                    </span>
                  )}
                  {deleteConfirmation.type === 'connection' && connectionsModalProfile && (
                    <span className="block mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {connectionsModalProfile.selectedConnectionAlias === deleteConfirmation.item.name && 
                        'This is the active connection. '
                      }
                      This will permanently remove this connection from the profile.
                    </span>
                  )}
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={deleteConfirmation.type === 'profile' ? confirmDeleteProfile : confirmDeleteConnection}
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete {deleteConfirmation.type === 'profile' ? 'Profile' : 'Connection'}</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirmation({ type: 'profile', isOpen: false, item: null })}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Profile Modal */}
      <AnimatePresence>
        {isCreateProfileModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsCreateProfileModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Create New Profile</h2>
                    <p className="text-blue-100">Set up a streaming profile with your connection details</p>
                  </div>
                  <button
                    onClick={() => setIsCreateProfileModalOpen(false)}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Profile Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Profile Alias *
                    </label>
                    <input
                      type="text"
                      value={newProfileForm.alias}
                      onChange={(e) => setNewProfileForm({ ...newProfileForm, alias: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter profile name (e.g., TLFN)"
                    />
                  </div>
                </div>

                {/* Connection Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Initial Connection</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Connection Alias *
                      </label>
                      <input
                        type="text"
                        value={newProfileForm.connectionAlias}
                        onChange={(e) => setNewProfileForm({ ...newProfileForm, connectionAlias: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Connection name (e.g., MIGUEL)"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        RTMP URL *
                      </label>
                      <input
                        type="text"
                        value={newProfileForm.rtmpUrl}
                        onChange={(e) => setNewProfileForm({ ...newProfileForm, rtmpUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="rtmp://a.rtmp.youtube.com/live2"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Stream Key
                      </label>
                      <input
                        type="text"
                        value={newProfileForm.streamKey}
                        onChange={(e) => setNewProfileForm({ ...newProfileForm, streamKey: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="m14a-4tmq-pw1x-2m51-46ps"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full URL (Optional)
                      </label>
                      <input
                        type="text"
                        value={newProfileForm.fullUrl}
                        onChange={(e) => setNewProfileForm({ ...newProfileForm, fullUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Complete RTMP URL (auto-generated if empty)"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile Settings Preview */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Profile Settings (Default)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Video Settings</h4>
                      <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                        <li>Resolution: 1080p</li>
                        <li>FPS: 30</li>
                        <li>Codec: H265</li>
                        <li>Bitrate: 15 Mbps</li>
                        <li>Source: Device Camera</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Audio & Recording</h4>
                      <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                        <li>Audio Source: Device Audio</li>
                        <li>Audio Bitrate: 160 Kbps</li>
                        <li>Record Resolution: 1080p</li>
                        <li>Record Bitrate: 25 Mbps</li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    These settings are standardized. You can manage connections after creating the profile.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={handleCreateProfile}
                    disabled={!newProfileForm.alias || !newProfileForm.connectionAlias || !newProfileForm.rtmpUrl}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Create Profile</span>
                  </button>
                  <button
                    onClick={() => setIsCreateProfileModalOpen(false)}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connections Management Modal */}
      <AnimatePresence>
        {isConnectionsModalOpen && connectionsModalProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseConnectionsModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Manage Connections</h2>
                    <p className="text-blue-100">{connectionsModalProfile.alias}</p>
                  </div>
                  <button
                    onClick={handleCloseConnectionsModal}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Add New Connection Button */}
                <button
                  onClick={handleAddConnection}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add New Connection</span>
                </button>

                {/* Connection Form */}
                {showConnectionForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {editingConnection ? 'Edit Connection' : 'New Connection'}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Alias
                        </label>
                        <input
                          type="text"
                          value={connectionForm.alias}
                          onChange={(e) => setConnectionForm({ ...connectionForm, alias: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          placeholder="Connection name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          RTMP URL
                        </label>
                        <input
                          type="text"
                          value={connectionForm.rtmp_url}
                          onChange={(e) => setConnectionForm({ ...connectionForm, rtmp_url: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          placeholder="rtmp://..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Stream Key
                        </label>
                        <input
                          type="text"
                          value={connectionForm.streamkey}
                          onChange={(e) => setConnectionForm({ ...connectionForm, streamkey: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          placeholder="Stream key"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Full URL
                        </label>
                        <input
                          type="text"
                          value={connectionForm.full_url}
                          onChange={(e) => setConnectionForm({ ...connectionForm, full_url: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                          placeholder="Complete RTMP URL with key"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={handleSaveConnection}
                        disabled={!connectionForm.alias || !connectionForm.rtmp_url}
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingConnection(null);
                          setShowConnectionForm(false);
                          setConnectionForm({ alias: '', full_url: '', rtmp_url: '', streamkey: '' });
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Connections List */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Connections ({connectionsModalProfile.connections.length})
                  </h3>
                  
                  {connectionsModalProfile.connections.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No connections configured. Add your first connection above.
                    </div>
                  ) : (
                    connectionsModalProfile.connections.map((connection, index) => (
                      <motion.div
                        key={connection.alias}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {connection.alias}
                              </h4>
                              {connectionsModalProfile.selectedConnectionAlias === connection.alias && (
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                              <div>
                                <span className="font-medium">RTMP:</span> {connection.rtmp_url}
                              </div>
                              {connection.streamkey && (
                                <div>
                                  <span className="font-medium">Key:</span> {'*'.repeat(20)}...
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditConnection(connection)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteConnection(connection.alias)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Configurations;