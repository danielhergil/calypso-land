import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Save, User, MapPin, Calendar, Mail, Shield, Youtube, Plus, X, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { firestoreService } from '../firebase/services';
import { compressImage, isValidImageFile, formatFileSize } from '../utils/imageCompression';
import { showError, showSuccess } from '../utils/notifications';

interface UserProfile {
  email: string;
  role: string;
  createdAt: string;
  country?: string;
  city?: string;
  avatar?: string;
  channel_ids?: {
    youtube: string[];
  };
}

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Form states
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [youtubeChannels, setYoutubeChannels] = useState<string[]>([]);
  const [newYoutubeChannel, setNewYoutubeChannel] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userData = await firestoreService.getUser(user.uid);
        if (userData) {
          setProfile(userData as UserProfile);
          setCountry(userData.country || '');
          setCity(userData.city || '');
          setYoutubeChannels(userData.channel_ids?.youtube || []);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        showError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!isValidImageFile(file)) {
      showError('Please select a valid image file (JPEG, PNG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showError('File size must be less than 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      // Compress the image
      const compressedFile = await compressImage(file, {
        maxWidth: 256,
        maxHeight: 256,
        quality: 0.85,
        format: 'image/jpeg',
        maxSizeKB: 100
      });

      // Upload to Firebase Storage
      const avatarUrl = await firestoreService.uploadImage(
        compressedFile,
        `users/${user.uid}/avatar_picture`
      );

      // Update user profile with avatar URL
      await firestoreService.updateUser(user.uid, { avatar: avatarUrl });

      setProfile(prev => prev ? { ...prev, avatar: avatarUrl } : null);
      showSuccess('Avatar updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showError('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const addYoutubeChannel = () => {
    if (!newYoutubeChannel.trim()) return;
    
    if (youtubeChannels.includes(newYoutubeChannel.trim())) {
      showError('Channel ID already exists');
      return;
    }

    setYoutubeChannels([...youtubeChannels, newYoutubeChannel.trim()]);
    setNewYoutubeChannel('');
  };

  const removeYoutubeChannel = (index: number) => {
    setYoutubeChannels(youtubeChannels.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const updateData: Partial<UserProfile> = {
        country: country.trim() || undefined,
        city: city.trim() || undefined,
        channel_ids: youtubeChannels.length > 0 ? { youtube: youtubeChannels } : undefined
      };

      await firestoreService.updateUser(user.uid, updateData);
      
      setProfile(prev => prev ? { ...prev, ...updateData } : null);
      showSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile not found</h2>
          <p className="text-gray-600 dark:text-gray-400">Unable to load profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('navigation.profile')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('profile.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="text-center">
                {/* Avatar */}
                <div className="relative inline-block mb-4">
                  <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{profile.email}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm capitalize">{profile.role}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{new Date(profile.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Editable Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Location Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                {t('profile.location.title')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('profile.location.country')}
                  </label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={t('profile.location.countryPlaceholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('profile.location.city')}
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={t('profile.location.cityPlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* YouTube Channels */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Youtube className="w-5 h-5 mr-2 text-red-600" />
                {t('profile.channels.youtube')}
              </h3>
              
              {/* Add New Channel */}
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={newYoutubeChannel}
                  onChange={(e) => setNewYoutubeChannel(e.target.value)}
                  placeholder={t('profile.channels.youtubePlaceholder')}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  onKeyPress={(e) => e.key === 'Enter' && addYoutubeChannel()}
                />
                <button
                  onClick={addYoutubeChannel}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Channel List */}
              <div className="space-y-2">
                {youtubeChannels.map((channelId, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-lg"
                  >
                    <span className="text-gray-900 dark:text-white font-mono text-sm">
                      {channelId}
                    </span>
                    <button
                      onClick={() => removeYoutubeChannel(index)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {youtubeChannels.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                    {t('profile.channels.noChannels')}
                  </p>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? t('common.saving') : t('common.save')}</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;