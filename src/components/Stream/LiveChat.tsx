import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  where,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { Send, Users, MessageCircle, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userDisplayName: string;
  userAvatar?: string;
  timestamp: any;
  streamId: string;
}

interface LiveChatProps {
  streamId: string;
}

// Function to generate avatar based on user name
const generateAvatar = (name: string): string => {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  const initial = name.charAt(0).toUpperCase();
  const colorIndex = name.charCodeAt(0) % colors.length;
  return `${colors[colorIndex]} flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-semibold`;
};

const LiveChat: React.FC<LiveChatProps> = ({ streamId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [prevMessageCount, setPrevMessageCount] = useState(0);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Check if user is near bottom of chat
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;
      setShouldAutoScroll(isNearBottom);
      
      // Hide new messages indicator when user scrolls to bottom
      if (isNearBottom) {
        setHasNewMessages(false);
      }
    }
  };

  // Auto-scroll to newest messages
  useEffect(() => {
    if (messages.length > prevMessageCount) {
      if (shouldAutoScroll) {
        // Small delay to ensure DOM is updated
        setTimeout(() => scrollToBottom(), 100);
      } else {
        // Show indicator for new messages when user is not at bottom
        setHasNewMessages(true);
      }
      setPrevMessageCount(messages.length);
    }
  }, [messages, shouldAutoScroll, prevMessageCount]);

  // Initial scroll to bottom when messages first load
  useEffect(() => {
    if (messages.length > 0 && prevMessageCount === 0) {
      setTimeout(() => scrollToBottom(), 200);
    }
  }, [messages, prevMessageCount]);

  // Listen to chat messages
  useEffect(() => {
    if (!streamId) return;

    const chatCollection = collection(db, 'liveChats');
    const chatQuery = query(
      chatCollection,
      where('streamId', '==', streamId),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(chatQuery, (snapshot) => {
      const chatMessages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        chatMessages.push({
          id: doc.id,
          ...data
        } as ChatMessage);
      });
      
      // Messages are already in chronological order (oldest first)
      setMessages(chatMessages);
      setIsLoading(false);
    }, (error) => {
      console.error('Error listening to chat messages:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [streamId]);

  // Simulate online users count (in a real app, you'd track this properly)
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers(Math.floor(Math.random() * 50) + 10); // 10-60 users
    }, 10000); // Update every 10 seconds

    // Set initial count
    setOnlineUsers(Math.floor(Math.random() * 50) + 10);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!user || !newMessage.trim() || !streamId) return;

    try {
      const chatCollection = collection(db, 'liveChats');
      await addDoc(chatCollection, {
        text: newMessage.trim(),
        userId: user.uid,
        userDisplayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userAvatar: user.photoURL || null,
        timestamp: serverTimestamp(),
        streamId: streamId
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [user, newMessage, streamId]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: any): string => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center text-gray-900 dark:text-white text-sm">
            <MessageCircle className="w-4 h-4 mr-2" />
            Live Chat
          </h3>
          <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
            <Users className="w-3 h-3 mr-1" />
            <span>{onlineUsers}</span>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900 relative"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Be the first to say something!</p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex space-x-3 group hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 -mx-2"
              >
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  {message.userAvatar ? (
                    <img
                      src={message.userAvatar}
                      alt={message.userDisplayName}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className={generateAvatar(message.userDisplayName)}>
                      {message.userDisplayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline space-x-2">
                    <span className="font-medium text-sm text-blue-600 dark:text-blue-400 truncate">
                      {message.userDisplayName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 break-words">
                    {message.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
        
        {/* New Messages Indicator */}
        {hasNewMessages && !shouldAutoScroll && (
          <div 
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full cursor-pointer hover:bg-blue-700 transition-colors z-10"
            onClick={() => {
              setShouldAutoScroll(true);
              scrollToBottom();
              setHasNewMessages(false);
            }}
          >
            New messages ↓
          </div>
        )}
      </div>

      {/* Chat Input - YouTube/Twitch Style */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex-shrink-0">
        {user ? (
          <div className="flex items-center space-x-3">
            {/* User Avatar */}
            <div className="flex-shrink-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className={`${generateAvatar(user.displayName || user.email?.split('@')[0] || 'User')} text-xs`}>
                  {(user.displayName || user.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Input Container */}
            <div className="flex-1 flex">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Say something..."
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 rounded-l-full focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 focus:border-blue-500 transition-colors text-sm"
                maxLength={200}
              />
              
              {/* Send Button */}
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-r-full hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center border border-l-0 border-blue-600 disabled:border-gray-400"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <div className="text-gray-600 dark:text-gray-400 mb-3">
              <UserPlus className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sign in to chat</p>
            </div>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors text-sm font-medium">
              Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveChat;