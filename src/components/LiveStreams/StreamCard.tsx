import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Clock, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { YouTubeService } from '../../services/youtubeService';

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

interface StreamCardProps {
  stream: StreamData;
  index: number;
  size?: 'normal' | 'large';
}

const StreamCard: React.FC<StreamCardProps> = ({ stream, index, size = 'normal' }) => {
  const isLarge = size === 'large';
  const cardHeight = isLarge ? 'h-44' : 'h-80';
  const imageHeight = isLarge ? 'h-full' : 'h-48';
  
  const formatViewers = (count: number): string => {
    return YouTubeService.formatViewers(count);
  };

  const truncateTitle = (title: string, maxLength: number = 60): string => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title;
  };

  const StreamContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer ${cardHeight} ${isLarge ? 'flex' : 'flex flex-col'}`}
    >
      {/* Thumbnail */}
      <div className={`relative ${isLarge ? 'flex-shrink-0 w-64' : 'flex-shrink-0'}`}>
        <img
          src={stream.thumbnail}
          alt={stream.title}
          className={`w-full ${imageHeight} object-cover group-hover:scale-105 transition-transform duration-300`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/default-thumbnail.jpg';
          }}
        />
        
        {/* Live indicator */}
        {stream.isLive && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
            <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
            LIVE
          </div>
        )}
        
        {/* Duration */}
        <div className="absolute top-3 right-3 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
          {stream.duration}
        </div>
        
        {/* Viewers */}
        <div className="absolute bottom-3 right-3 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded flex items-center">
          <Eye className="w-3 h-3 mr-1" />
          {formatViewers(stream.viewers)}
        </div>

        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
          <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>
      
      {/* Content */}
      <div className={`p-4 ${isLarge ? 'flex-1 flex flex-col justify-between' : 'flex-1 flex flex-col justify-between'}`}>
        <div className={isLarge ? 'flex-1' : ''}>
          <h3 className={`font-semibold text-gray-900 dark:text-white mb-2 ${isLarge ? 'line-clamp-2' : 'line-clamp-2 h-12 overflow-hidden'}`}>
            {truncateTitle(stream.title, isLarge ? 80 : 60)}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
            {stream.channelName}
          </p>
          
          {isLarge && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
              <Eye className="w-4 h-4 mr-1" />
              {stream.viewers.toLocaleString()} viewers
              <Clock className="w-4 h-4 ml-4 mr-1" />
              {stream.duration}
            </div>
          )}
        </div>
        
        <div className={`flex items-center justify-between ${isLarge ? 'mt-2' : 'gap-2'}`}>
          {stream.isFeatured ? (
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
              Featured
            </span>
          ) : (
            <span className={`text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded truncate ${isLarge ? 'flex-shrink-0' : 'flex-shrink-0 max-w-24'}`}>
              {stream.category}
            </span>
          )}
          
          <div className={`flex space-x-1 ${isLarge ? 'ml-4' : 'overflow-hidden'}`}>
            {stream.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs text-blue-600 dark:text-blue-400 truncate"
              >
                #{tag}
              </span>
            ))}
          </div>
          
          {isLarge && (
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Watch Now
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <Link to={`/stream/${stream.videoId}`}>
      <StreamContent />
    </Link>
  );
};

export default StreamCard;