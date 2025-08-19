import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Users, 
  Eye, 
  Heart, 
  Share2, 
  ArrowLeft,
  Clock,
  Tag,
  Send,
  MessageCircle
} from 'lucide-react';
import { UserChannelsService } from '../services/userChannelsService';
import { useAuth } from '../contexts/AuthContext';
import LiveChat from '../components/Stream/LiveChat';

interface StreamData {
  id: string;
  title: string;
  channelName: string;
  channelId?: string;
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

// YouTube embed component
const YouTubeEmbed: React.FC<{ videoId: string; title: string }> = ({ videoId, title }) => {
  return (
    <div className="relative w-full h-full">
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&enablejsapi=1&origin=${window.location.origin}`}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        className="absolute top-0 left-0 w-full h-full"
      ></iframe>
    </div>
  );
};

const StreamViewer: React.FC = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stream, setStream] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchStreamData = async () => {
      if (!streamId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // First try to find the stream in our live streams
        const allStreams = await UserChannelsService.getLiveStreamsFromAllChannels();
        const foundStream = allStreams.find(s => s.videoId === streamId || s.id === streamId);
        
        if (foundStream) {
          setStream(foundStream);
        } else {
          // If not found in live streams, it might not be live anymore
          setError('Stream not found or no longer live');
        }
      } catch (err) {
        console.error('Error fetching stream data:', err);
        setError('Failed to load stream');
      } finally {
        setLoading(false);
      }
    };

    fetchStreamData();
  }, [streamId]);

  const formatViewers = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: stream?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error || 'Stream not found'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This stream may have ended or doesn't exist.
          </p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Browse</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          {stream.isLive && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-500 text-sm font-medium">LIVE</span>
              <span className="text-gray-400">•</span>
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Eye className="w-4 h-4 mr-1" />
                <span>{formatViewers(stream.viewers)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex h-[calc(100vh-60px)]">
        {/* Main Content - Scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {/* YouTube Video Player */}
          <div className="bg-black aspect-video relative">
            <YouTubeEmbed videoId={stream.videoId} title={stream.title} />
            
            {/* Live Indicator Overlay */}
            {stream.isLive && (
              <div className="absolute top-4 left-4 bg-red-500 text-white text-sm px-3 py-1 rounded-full flex items-center z-10">
                <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                LIVE
              </div>
            )}
          </div>

          {/* Stream Info */}
          <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{stream.title}</h1>
                <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400 text-sm mb-3">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{stream.duration}</span>
                  </div>
                  <div className="flex items-center">
                    <Tag className="w-4 h-4 mr-1" />
                    <span>{stream.category}</span>
                  </div>
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    <span>{formatViewers(stream.viewers)} viewers</span>
                  </div>
                </div>
                {stream.description && (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{stream.description}</p>
                )}
              </div>
            </div>

            {/* Channel Info & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {stream.channelName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{stream.channelName}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{formatViewers(stream.viewers)} watching</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleFollow}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isFollowing
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
                  <span>{isFollowing ? 'Following' : 'Follow'}</span>
                </button>
                
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Tags */}
            {stream.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {stream.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Chat Sidebar */}
        <LiveChat streamId={stream.videoId} />
      </div>
    </div>
  );
};

export default StreamViewer;