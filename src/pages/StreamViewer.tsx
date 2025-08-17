import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Play, 
  Users, 
  Eye, 
  Heart, 
  Share2, 
  Settings, 
  Maximize, 
  Volume2, 
  VolumeX,
  ArrowLeft,
  Clock,
  MapPin,
  Tag
} from 'lucide-react';

interface StreamData {
  id: string;
  title: string;
  description: string;
  streamerName: string;
  streamerAvatar: string;
  viewers: number;
  isLive: boolean;
  duration: string;
  category: string;
  tags: string[];
  playbackUrl: string;
  thumbnail: string;
  quality: {
    resolution: string;
    fps: number;
    bitrate: number;
  };
  location?: {
    city: string;
    country: string;
  };
  startedAt: string;
}

// Mock stream data - in real app this would come from Firestore
const mockStreamData: StreamData = {
  id: '1',
  title: 'Basketball Championship Finals - Lakers vs Warriors',
  description: 'Epic basketball match between two legendary teams. Don\'t miss this incredible showdown with amazing plays and nail-biting moments!',
  streamerName: 'SportsCaster Pro',
  streamerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  viewers: 2453,
  isLive: true,
  duration: '2h 15m',
  category: 'Basketball',
  tags: ['Finals', 'Professional', 'Live', 'Championship'],
  playbackUrl: 'https://example.com/stream/1',
  thumbnail: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=450&fit=crop',
  quality: {
    resolution: '1920x1080',
    fps: 60,
    bitrate: 5000
  },
  location: {
    city: 'Los Angeles',
    country: 'United States'
  },
  startedAt: '2024-01-15T14:30:00Z'
};

const StreamViewer: React.FC = () => {
  const { streamId } = useParams<{ streamId: string }>();
  const { t } = useTranslation();
  const [stream, setStream] = useState<StreamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  useEffect(() => {
    // Simulate loading stream data
    setTimeout(() => {
      setStream(mockStreamData);
      setLoading(false);
    }, 1000);
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Stream not found</h2>
          <p className="text-gray-400 mb-4">This stream may have ended or doesn't exist.</p>
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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Browse</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400 text-sm font-medium">LIVE</span>
            <span className="text-gray-400">•</span>
            <div className="flex items-center text-gray-300">
              <Eye className="w-4 h-4 mr-1" />
              <span>{formatViewers(stream.viewers)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-60px)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Video Player */}
          <div className="bg-black aspect-video relative group">
            <img
              src={stream.thumbnail}
              alt={stream.title}
              className="w-full h-full object-cover"
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center space-x-4">
                <button className="bg-black bg-opacity-60 text-white p-3 rounded-full hover:bg-opacity-80 transition-colors">
                  <Play className="w-8 h-8" />
                </button>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <div className="text-sm text-gray-300">
                    {stream.quality.resolution} • {stream.quality.fps}fps
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="text-white hover:text-blue-400 transition-colors">
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="text-white hover:text-blue-400 transition-colors"
                  >
                    <Maximize className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Live Indicator */}
            <div className="absolute top-4 left-4 bg-red-500 text-white text-sm px-3 py-1 rounded-full flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
              LIVE
            </div>

            {/* Quality Badge */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white text-sm px-2 py-1 rounded">
              {stream.quality.resolution}
            </div>
          </div>

          {/* Stream Info */}
          <div className="p-6 bg-gray-800">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{stream.title}</h1>
                <div className="flex items-center space-x-4 text-gray-400 text-sm mb-3">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{stream.duration}</span>
                  </div>
                  {stream.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{stream.location.city}, {stream.location.country}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <Tag className="w-4 h-4 mr-1" />
                    <span>{stream.category}</span>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">{stream.description}</p>
              </div>
            </div>

            {/* Streamer Info & Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={stream.streamerAvatar}
                  alt={stream.streamerName}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="font-semibold">{stream.streamerName}</h3>
                  <p className="text-gray-400 text-sm">{formatViewers(stream.viewers)} viewers</p>
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
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {stream.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-700 text-gray-300 text-sm px-3 py-1 rounded-full hover:bg-gray-600 transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 bg-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Stream Chat
            </h3>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Mock chat messages */}
            <div className="text-sm">
              <span className="text-blue-400 font-medium">SportsFan92:</span>
              <span className="ml-2 text-gray-300">Amazing game so far! 🏀</span>
            </div>
            <div className="text-sm">
              <span className="text-green-400 font-medium">BasketballLover:</span>
              <span className="ml-2 text-gray-300">LET'S GO LAKERS!</span>
            </div>
            <div className="text-sm">
              <span className="text-purple-400 font-medium">GameWatcher:</span>
              <span className="ml-2 text-gray-300">This is so intense 😱</span>
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamViewer;