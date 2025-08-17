import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Play, Users, Eye, Clock, Star, TrendingUp, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LiveStream {
  id: string;
  title: string;
  streamerName: string;
  viewers: number;
  thumbnail: string;
  category: string;
  isLive: boolean;
  duration: string;
  tags: string[];
}

// Mock data - in real app this would come from your database
const mockLiveStreams: LiveStream[] = [
  {
    id: '1',
    title: 'Basketball Championship Finals - Lakers vs Warriors',
    streamerName: 'SportsCaster Pro',
    viewers: 2453,
    thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=225&fit=crop',
    category: 'Basketball',
    isLive: true,
    duration: '2h 15m',
    tags: ['Finals', 'Professional', 'Live']
  },
  {
    id: '2', 
    title: 'Local Soccer Match - City Derby',
    streamerName: 'Football Fan',
    viewers: 891,
    thumbnail: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=225&fit=crop',
    category: 'Soccer',
    isLive: true,
    duration: '1h 30m',
    tags: ['Local', 'Derby', 'Exciting']
  },
  {
    id: '3',
    title: 'Tennis Tournament Quarter Finals',
    streamerName: 'Tennis Pro Stream',
    viewers: 1247,
    thumbnail: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=225&fit=crop',
    category: 'Tennis',
    isLive: true,
    duration: '45m',
    tags: ['Tournament', 'Professional']
  },
  {
    id: '4',
    title: 'High School Football Game',
    streamerName: 'SchoolSports',
    viewers: 324,
    thumbnail: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&h=225&fit=crop',
    category: 'American Football',
    isLive: true,
    duration: '3h 5m',
    tags: ['High School', 'Community']
  }
];

const PublicHomepage: React.FC = () => {
  const { t } = useTranslation();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading streams
    setTimeout(() => {
      setStreams(mockLiveStreams);
      setLoading(false);
    }, 1000);
  }, []);

  const categories = ['All', 'Basketball', 'Soccer', 'Tennis', 'American Football', 'Baseball'];

  const filteredStreams = selectedCategory === 'All' 
    ? streams 
    : streams.filter(stream => stream.category === selectedCategory);

  const formatViewers = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
<p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredStreams.map((stream, index) => (
              <Link 
                key={stream.id}
                to={`/stream/${stream.id}`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer h-80 flex flex-col"
                >
                <div className="relative flex-shrink-0">
                  <img
                    src={stream.thumbnail}
                    alt={stream.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                    LIVE
                  </div>
                  <div className="absolute top-3 right-3 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    {stream.duration}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {formatViewers(stream.viewers)}
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 h-12 overflow-hidden">
                      {stream.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {stream.streamerName}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded truncate flex-shrink-0 max-w-24">
                      {stream.category}
                    </span>
                    <div className="flex space-x-1 overflow-hidden">
                      {stream.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-blue-600 dark:text-blue-400 truncate"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured Section */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <Star className="w-6 h-6 text-yellow-500 mr-2" />
<h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('public.sections.featured')}</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {streams.slice(0, 2).map((stream, index) => (
              <Link key={`featured-${stream.id}`} to={`/stream/${stream.id}`}>
                <motion.div
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer h-44"
                >
                <div className="flex h-full">
                  <div className="relative flex-shrink-0 w-64">
                    <img
                      src={stream.thumbnail}
                      alt={stream.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                      LIVE
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {stream.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        {stream.streamerName}
                      </p>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <Eye className="w-4 h-4 mr-1" />
                        {stream.viewers.toLocaleString()} viewers
                        <Clock className="w-4 h-4 ml-4 mr-1" />
                        {stream.duration}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                        Featured
                      </span>
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        {t('public.stream.watchNow')}
                      </button>
                    </div>
                  </div>
                </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicHomepage;