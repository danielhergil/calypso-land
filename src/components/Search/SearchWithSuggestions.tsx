import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

interface SearchWithSuggestionsProps {
  streams: StreamData[];
  onSearchChange: (query: string) => void;
  placeholder?: string;
  className?: string;
}

interface Suggestion {
  type: 'channel' | 'tag';
  value: string;
  count: number;
}

const SearchWithSuggestions: React.FC<SearchWithSuggestionsProps> = ({
  streams,
  onSearchChange,
  placeholder = "Search live streams, channels, or tags...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Generate suggestions based on current streams
  const generateSuggestions = useCallback((searchQuery: string): Suggestion[] => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase();
    const suggestionMap = new Map<string, Suggestion>();

    // Add channel suggestions
    streams.forEach(stream => {
      const channelName = stream.channelName.toLowerCase();
      if (channelName.includes(query)) {
        const existing = suggestionMap.get(stream.channelName);
        if (existing) {
          existing.count++;
        } else {
          suggestionMap.set(stream.channelName, {
            type: 'channel',
            value: stream.channelName,
            count: 1
          });
        }
      }
    });

    // Add tag suggestions
    streams.forEach(stream => {
      stream.tags.forEach(tag => {
        const tagLower = tag.toLowerCase();
        if (tagLower.includes(query)) {
          const existing = suggestionMap.get(tag);
          if (existing) {
            existing.count++;
          } else {
            suggestionMap.set(tag, {
              type: 'tag',
              value: tag,
              count: 1
            });
          }
        }
      });
    });

    // Convert to array and sort by relevance (exact matches first, then by count)
    return Array.from(suggestionMap.values())
      .sort((a, b) => {
        // Exact matches first
        const aExact = a.value.toLowerCase() === query;
        const bExact = b.value.toLowerCase() === query;
        if (aExact && !bExact) return -1;
        if (bExact && !aExact) return 1;
        
        // Then by count (popularity)
        return b.count - a.count;
      })
      .slice(0, 6); // Limit to 6 suggestions
  }, [streams]);

  useEffect(() => {
    const newSuggestions = generateSuggestions(query);
    setSuggestions(newSuggestions);
    setSelectedIndex(-1);
  }, [query, generateSuggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearchChange(value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setQuery(suggestion.value);
    onSearchChange(suggestion.value);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const clearSearch = () => {
    setQuery('');
    onSearchChange('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (query.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSuggestions(false), 150);
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder={placeholder}
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.value}`}
                onClick={() => handleSuggestionClick(suggestion)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                  index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                } ${index === 0 ? 'rounded-t-lg' : ''} ${index === suggestions.length - 1 ? 'rounded-b-lg' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    suggestion.type === 'channel' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                  }`}>
                    {suggestion.type === 'channel' ? 'Channel' : 'Tag'}
                  </div>
                  <span className="truncate">{suggestion.value}</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {suggestion.count} stream{suggestion.count !== 1 ? 's' : ''}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchWithSuggestions;