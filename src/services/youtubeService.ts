interface YouTubeMetadata {
  method: string;
  videoId: string; // For videos, this is the video ID. For channels, this could be the live video ID or channel ID
  channelId?: string; // Channel ID (when fetching by channel)
  title: string;
  channelName: string;
  isLiveNow: boolean;
  concurrentViewers: number;
  viewerCountType: string;
  thumbnails: Array<{
    url: string;
    width: number;
    height: number;
  }>;
  description: string;
  actualStartTime: string;
  isLiveContent: boolean;
  duration: null;
  liveDuration: string;
  liveDurationSeconds: number;
  tags: string[];
}


interface YouTubeResponse {
  success: boolean;
  data: YouTubeMetadata;
  cached: boolean;
  timestamp: string;
}

interface BatchChannelResult {
  isLive: boolean;
  liveVideoId: string | null;
  videoData: YouTubeMetadata | null;
  videoError: string | null;
  method: string;
  error?: string | null;
}

interface BatchChannelsResponse {
  success: boolean;
  results: Record<string, BatchChannelResult>;
  summary: {
    total: number;
    live: number;
    notLive: number;
    errors: number;
    videoDataFetched: number;
  };
  quotaUsed: number;
  timestamp: string;
}

// Global cache and request tracking outside the class to persist across instances
const globalCache = new Map<string, { data: YouTubeResponse; timestamp: number }>();
const pendingRequests = new Map<string, Promise<YouTubeResponse>>();
const CACHE_DURATION = 30000; // 30 seconds cache

export class YouTubeService {
  private static readonly BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://calypso-land-back-production.up.railway.app/api/status';
  

  static async getVideoMetadata(videoId: string): Promise<YouTubeResponse> {
    try {
      // Check cache first
      const cached = globalCache.get(videoId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`Using cached data for video: ${videoId}`);
        return cached.data;
      }

      // Check if there's already a pending request for this video
      const pending = pendingRequests.get(videoId);
      if (pending) {
        console.log(`Waiting for existing request for video: ${videoId}`);
        return await pending;
      }

      console.log(`Fetching cached metadata for video: ${videoId}`);
      
      // Create and track the request promise
      const requestPromise = this.fetchVideoData(videoId);
      pendingRequests.set(videoId, requestPromise);
      
      try {
        const result = await requestPromise;
        return result;
      } finally {
        // Clean up the pending request
        pendingRequests.delete(videoId);
      }
    } catch (error) {
      console.error(`Error fetching video metadata for ${videoId}:`, error);
      throw error;
    }
  }

  private static async fetchVideoData(videoId: string): Promise<YouTubeResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/video/${videoId}`);
      
      if (!response.ok) {
        // Special handling for 400 errors (invalid video IDs)
        if (response.status === 400) {
          throw new Error(`Invalid video ID: ${videoId}`);
        }
        
        console.error(`API Error: ${response.status} - ${response.statusText}`);
        
        // If we have cached data (even if expired), use it instead of failing
        const cached = globalCache.get(videoId);
        if (cached) {
          console.log(`Using expired cache data for video: ${videoId} due to API error`);
          return cached.data;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache the successful response
      globalCache.set(videoId, { data, timestamp: Date.now() });
      
      console.log(`✅ Video metadata received for ${videoId}:`, {
        title: data.data?.title,
        isLive: data.data?.isLiveNow,
        viewers: data.data?.concurrentViewers,
        duration: data.data?.liveDuration,
        tags: data.data?.tags?.slice(0, 3)
      });
      return data;
    } catch (error) {
      // Don't spam console for invalid video IDs
      if (error.message.includes('Invalid video ID')) {
        throw error;
      }
      console.error(`Error in fetchVideoData for ${videoId}:`, error);
      throw error;
    }
  }
  
  static async getChannelMetadata(channelId: string): Promise<YouTubeResponse> {
    try {
      // Check cache first (reuse the same cache as videos for simplicity)
      const cached = globalCache.get(`channel:${channelId}`);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`Using cached data for channel: ${channelId}`);
        return cached.data;
      }

      // Check if there's already a pending request for this channel
      const pending = pendingRequests.get(`channel:${channelId}`);
      if (pending) {
        console.log(`Waiting for existing request for channel: ${channelId}`);
        return await pending;
      }

      console.log(`Fetching cached metadata for channel: ${channelId}`);
      
      // Create and track the request promise
      const requestPromise = this.fetchChannelData(channelId);
      pendingRequests.set(`channel:${channelId}`, requestPromise);
      
      try {
        const result = await requestPromise;
        return result;
      } finally {
        // Clean up the pending request
        pendingRequests.delete(`channel:${channelId}`);
      }
    } catch (error) {
      console.error(`Error fetching channel metadata for ${channelId}:`, error);
      throw error;
    }
  }

  private static async fetchChannelData(channelId: string): Promise<YouTubeResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}/channel/${channelId}`);
      
      if (!response.ok) {
        // Special handling for 400 errors (invalid channel IDs)
        if (response.status === 400) {
          throw new Error(`Invalid channel ID: ${channelId}`);
        }
        
        console.error(`API Error: ${response.status} - ${response.statusText}`);
        
        // If we have cached data (even if expired), use it instead of failing
        const cached = globalCache.get(`channel:${channelId}`);
        if (cached) {
          console.log(`Using expired cache data for channel: ${channelId} due to API error`);
          return cached.data;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache the successful response
      globalCache.set(`channel:${channelId}`, { data, timestamp: Date.now() });
      
      console.log(`✅ Channel metadata received for ${channelId}:`, {
        title: data.data?.title,
        isLive: data.data?.isLiveNow,
        viewers: data.data?.concurrentViewers,
        duration: data.data?.liveDuration,
        tags: data.data?.tags?.slice(0, 3)
      });
      return data;
    } catch (error) {
      // Don't spam console for invalid channel IDs
      if (error.message.includes('Invalid channel ID')) {
        throw error;
      }
      console.error(`Error in fetchChannelData for ${channelId}:`, error);
      throw error;
    }
  }
  
  static async getChannelsMetadata(channelIds: string[]): Promise<YouTubeResponse[]> {
    // Use the new batch API for better performance
    return await this.getChannelsMetadataBatch(channelIds);
  }

  static async getChannelsMetadataBatch(channelIds: string[]): Promise<YouTubeResponse[]> {
    if (channelIds.length === 0) return [];

    try {
      console.log(`📡 Fetching metadata for ${channelIds.length} channels using batch API...`);

      // Check cache for all channels first
      const results: YouTubeResponse[] = [];
      const uncachedChannelIds: string[] = [];

      for (const channelId of channelIds) {
        const cached = globalCache.get(`channel:${channelId}`);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          console.log(`Using cached data for channel: ${channelId}`);
          results.push(cached.data);
        } else {
          uncachedChannelIds.push(channelId);
        }
      }

      // If all channels are cached, return cached results
      if (uncachedChannelIds.length === 0) {
        console.log(`✅ All ${channelIds.length} channels found in cache`);
        return results;
      }

      console.log(`🔄 Fetching ${uncachedChannelIds.length} uncached channels from batch API...`);

      const response = await fetch(`${this.BASE_URL}/batch/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelIds: uncachedChannelIds
        })
      });

      if (!response.ok) {
        console.error(`Batch API Error: ${response.status} - ${response.statusText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const batchData: BatchChannelsResponse = await response.json();

      if (!batchData.success) {
        throw new Error('Batch API returned unsuccessful response');
      }

      console.log(`✅ Batch API response:`, {
        total: batchData.summary.total,
        live: batchData.summary.live,
        notLive: batchData.summary.notLive,
        errors: batchData.summary.errors
      });

      // Convert batch results to individual responses and cache them
      for (const channelId of uncachedChannelIds) {
        const channelResult = batchData.results[channelId];

        if (channelResult && channelResult.isLive && channelResult.videoData) {
          // Channel is live - create successful response
          const youtubeResponse: YouTubeResponse = {
            success: true,
            data: channelResult.videoData,
            cached: false,
            timestamp: batchData.timestamp
          };

          // Cache the response
          globalCache.set(`channel:${channelId}`, {
            data: youtubeResponse,
            timestamp: Date.now()
          });

          results.push(youtubeResponse);
        } else if (channelResult && !channelResult.isLive) {
          // Channel is not live - create a response indicating this
          const youtubeResponse: YouTubeResponse = {
            success: false,
            data: {} as YouTubeMetadata, // Channel not live, no data
            cached: false,
            timestamp: batchData.timestamp
          };

          // Cache the response for a shorter time since channels can go live
          globalCache.set(`channel:${channelId}`, {
            data: youtubeResponse,
            timestamp: Date.now()
          });

          // Don't add non-live channels to results as they won't be displayed
        } else {
          // Channel has error or no result
          console.warn(`⚠️ Channel ${channelId} has error or no result in batch response`);
        }
      }

      console.log(`✅ Successfully processed ${results.length} channels (${results.length - (channelIds.length - uncachedChannelIds.length)} from API, ${channelIds.length - uncachedChannelIds.length} from cache)`);
      return results;

    } catch (error) {
      console.error('Error in batch channels API:', error);

      // Fallback to individual API calls if batch fails
      console.log('🔄 Falling back to individual channel API calls...');
      return await this.getChannelsMetadataFallback(channelIds);
    }
  }

  static async getChannelsMetadataFallback(channelIds: string[]): Promise<YouTubeResponse[]> {
    const results: YouTubeResponse[] = [];

    // Process channels one by one to avoid overwhelming the server
    for (const channelId of channelIds) {
      try {
        console.log(`Processing channel ${channelId}...`);
        const response = await this.getChannelMetadata(channelId);
        results.push(response);

        // Small delay to be respectful to the server (only if not cached)
        if (channelIds.indexOf(channelId) < channelIds.length - 1) {
          const wasCached = globalCache.has(`channel:${channelId}`) &&
            Date.now() - globalCache.get(`channel:${channelId}`)!.timestamp < CACHE_DURATION;
          if (!wasCached) {
            await this.delay(500); // Increased delay to be more respectful
          }
        }
      } catch {
        console.warn(`⚠️ Skipping invalid channel ID '${channelId}' - likely not a valid YouTube channel ID`);
        // Continue with other channels even if one fails
      }
    }

    console.log(`Successfully fetched ${results.length} out of ${channelIds.length} channels`);
    return results;
  }
  
  static async getVideosMetadata(videoIds: string[]): Promise<YouTubeResponse[]> {
    const results: YouTubeResponse[] = [];
    
    // Process videos one by one to avoid overwhelming the server
    for (const videoId of videoIds) {
      try {
        console.log(`Processing video ${videoId}...`);
        const response = await this.getVideoMetadata(videoId);
        results.push(response);
        
        // Small delay to be respectful to the server (only if not cached)
        if (videoIds.indexOf(videoId) < videoIds.length - 1) {
          const wasCached = globalCache.has(videoId) && 
            Date.now() - globalCache.get(videoId)!.timestamp < CACHE_DURATION;
          if (!wasCached) {
            await this.delay(500); // Increased delay to be more respectful
          }
        }
      } catch {
        console.warn(`⚠️ Skipping invalid video ID '${videoId}' - likely not a valid YouTube video ID`);
        // Continue with other videos even if one fails
      }
    }
    
    console.log(`Successfully fetched ${results.length} out of ${videoIds.length} videos`);
    return results;
  }
  
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static formatViewers(count: number | null): string {
    if (count === null || count === 0) return '0';
    
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }
}