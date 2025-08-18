import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Play, Users, Star, TrendingUp } from 'lucide-react';
import { UserChannelsService } from '../services/userChannelsService';
import { firestoreService } from '../firebase/services';
import StreamCard from '../components/LiveStreams/StreamCard';
import LoadingSpinner from '../components/LiveStreams/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

interface StreamData {
  id: string;
  title: string;
  channelName: string;
  viewers: number;
  thumbnail: string;
  category: string;
  isLive: boolean;
  duration: string;
  tags: string[];
  videoId: string;
  actualStartTime: string | null;
  description: string;
  isFeatured?: boolean;
}

// Test video IDs for development (fallback) - matching your database values
const TEST_VIDEO_IDS = [
  'VCWupbQE1Jw', // Your live stream (should be online)
  'phi36uzvzD0', // From your database
  'qwerty'       // From your database (might not work, but for testing)
];

// Set this to true to use real user data instead of test data
const USE_REAL_USER_DATA = true;

const PublicHomepage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [streams, setStreams] = useState<StreamData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);

  useEffect(() => {
    const loadStreams = async () => {
      // Prevent too frequent reloads (debounce) - but allow initial load
      const now = Date.now();
      if (lastLoadTime > 0 && now - lastLoadTime < 5000) { // 5 second debounce after first load
        return;
      }
      setLastLoadTime(now);

      try {
        setLoading(true);
        setError(null);
        
        let streamsData: StreamData[] = [];
        
        if (USE_REAL_USER_DATA) {
          // Get live streams from ALL users using the new global collection
          streamsData = await UserChannelsService.getLiveStreamsFromAllUsers();
          
          // If no live streams found, fall back to test video IDs as static content
          if (streamsData.length === 0) {
            streamsData = await UserChannelsService.getVideosAsStreams(TEST_VIDEO_IDS);
          }
        } else {
          streamsData = await UserChannelsService.getVideosAsStreams(TEST_VIDEO_IDS);
        }
        
        // Mark first two as featured for demo
        const streamsWithFeatured = streamsData.map((stream, index) => ({
          ...stream,
          isFeatured: index < 2
        }));
        
        setStreams(streamsWithFeatured);
      } catch (err) {
        console.error('Error loading streams:', err);
        setError('Failed to load live streams. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadStreams();
  }, [lastLoadTime]);

  const categories = ['All', 'Music', 'Entertainment', 'Gaming', 'Education', 'News'];

  const filteredStreams = selectedCategory === 'All' 
    ? streams 
    : streams.filter(stream => stream.category === selectedCategory);

  const featuredStreams = streams.filter(stream => stream.isFeatured);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <LoadingSpinner size="large" message="Loading live streams from all channels..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Streams</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl font-bold mb-4"
            >
{t('public.hero.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-blue-100 mb-8"
            >
{t('public.hero.subtitle')}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center space-x-6 text-sm"
            >
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span>{streams.reduce((acc, stream) => acc + stream.viewers, 0).toLocaleString()} {t('public.stream.viewers')}</span>
              </div>
              <div className="flex items-center">
                <Play className="w-5 h-5 mr-2" />
                <span>{streams.length} {t('public.sections.liveNow')}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Live Streams Grid */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <TrendingUp className="w-6 h-6 text-red-500 mr-2" />
<h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('public.sections.liveNow')}</h2>
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {filteredStreams.length}
            </span>
          </div>

          {filteredStreams.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📺</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No streams found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedCategory === 'All' 
                  ? 'No live streams are currently available.' 
                  : `No streams found in ${selectedCategory} category.`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredStreams.map((stream, index) => (
                <StreamCard 
                  key={stream.videoId} 
                  stream={stream} 
                  index={index} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Featured Section */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <Star className="w-6 h-6 text-yellow-500 mr-2" />
<h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('public.sections.featured')}</h2>
          </div>
          
          {featuredStreams.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                No featured streams available at the moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredStreams.slice(0, 2).map((stream, index) => (
                <StreamCard 
                  key={`featured-${stream.videoId}`}
                  stream={stream} 
                  index={index}
                  size="large"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicHomepage;