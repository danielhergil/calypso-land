import { firestoreService } from '../firebase/services';
import { YouTubeService } from './youtubeService';

interface YouTubeMetadata {
  method: string;
  videoId: string;
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

interface StreamData {
  id: string;
  title: string;
  channelName: string;
  channelId?: string; // Channel ID for the stream
  viewers: number;
  thumbnail: string;
  category: string;
  isLive: boolean;
  duration: string;
  tags: string[];
  videoId: string; // Current live video ID or stream ID
  actualStartTime: string | null;
  description: string;
  isFeatured?: boolean;
}

export class UserChannelsService {
  static async getUserChannels(userId: string): Promise<string[]> {
    try {
      const userData = await firestoreService.getUser(userId);
      return userData?.channel_ids?.youtube || [];
    } catch (error) {
      console.error('Error fetching user channels:', error);
      return [];
    }
  }
  
  static async getAllUsersChannels(): Promise<string[]> {
    try {
      console.log('Note: getAllUsersChannels() requires admin permissions or public collection');
      console.log('For testing, using curated public channels only');
      
      // For now, return only public channels since reading all users requires admin permissions
      return await this.getPublicChannelIds();
    } catch (error) {
      console.error('Error fetching all users channels:', error);
      return [];
    }
  }

  static async getAllUsersChannelIds(): Promise<string[]> {
    try {
      console.log('🗄️ Attempting to fetch channel IDs from global collection...');
      // Use the new efficient global channels collection
      const allChannelIds = await firestoreService.getAllChannelIds();
      console.log(`✅ Retrieved ${allChannelIds.length} channel IDs from global collection`);
      return allChannelIds;
    } catch (error) {
      console.error('Error fetching all channel IDs from global collection:', error);
      
      // Fallback to old method if global collection fails
      try {
        console.log('🔄 Falling back to fetching channel IDs from individual users...');
        const allUsers = await firestoreService.getAllUsers();
        console.log(`👥 Found ${allUsers.length} users in database`);
        
        const allChannelIds: string[] = [];
        
        for (const user of allUsers) {
          try {
            const userData = await firestoreService.getUser(user.id);
            const userChannelIds = userData?.channel_ids?.youtube || [];
            if (Array.isArray(userChannelIds)) {
              allChannelIds.push(...userChannelIds);
              console.log(`📝 User ${user.id} has ${userChannelIds.length} channel IDs`);
            }
          } catch {
            console.warn(`⚠️ Failed to get channel IDs for user ${user.id}`);
            // Continue with other users
          }
        }
        
        const uniqueChannelIds = [...new Set(allChannelIds)];
        console.log(`✅ Fallback method found ${uniqueChannelIds.length} unique channel IDs from ${allUsers.length} users`);
        return uniqueChannelIds;
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        return [];
      }
    }
  }
  
  
  static async getPublicChannelIds(): Promise<string[]> {
    // No public fallback channels - only use real user data
    return [];
  }

  static async getPublicVideoIds(): Promise<string[]> {
    // Deprecated - only keeping for backward compatibility
    return [];
  }
  
  static async getCurrentUserChannelIds(userId?: string): Promise<string[]> {
    if (!userId) {
      return [];
    }
    
    try {
      const userData = await firestoreService.getUser(userId);
      const userChannelIds = userData?.channel_ids?.youtube || [];
      
      if (Array.isArray(userChannelIds)) {
        return userChannelIds;
      } else if (userChannelIds) {
        return [userChannelIds];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching current user channel IDs:', error);
      return [];
    }
  }
  
  static async getChannelsLiveStreams(channelIds: string[]): Promise<StreamData[]> {
    if (channelIds.length === 0) return [];
    
    try {
      console.log(`📺 Checking ${channelIds.length} channels for live streams...`);
      const youtubeResponses = await YouTubeService.getChannelsMetadata(channelIds);
      
      const liveStreams = youtubeResponses
        .filter(response => response.success && response.data.isLiveNow)
        .map(response => this.transformToStreamData(response.data));
      
      console.log(`🔴 Found ${liveStreams.length} live streams out of ${channelIds.length} channels`);
      return liveStreams;
    } catch (error) {
      console.error('Error fetching channels live streams:', error);
      return [];
    }
  }
  
  // Get streams from channels - ONLY SHOWS LIVE STREAMS
  static async getChannelsAsStreams(channelIds: string[]): Promise<StreamData[]> {
    if (channelIds.length === 0) {
      return [];
    }
    
    try {
      const youtubeResponses = await YouTubeService.getChannelsMetadata(channelIds);
      
      // IMPORTANT: Only show channels that are currently live
      const liveResponses = youtubeResponses.filter(response => 
        response.success && response.data && response.data.isLiveNow
      );
      
      return liveResponses.map(response => 
        this.transformToStreamData(response.data)
      );
    } catch (error) {
      console.error('Error fetching channels as streams:', error);
      return [];
    }
  }

  // For backward compatibility - DEPRECATED: Use getChannelsAsStreams instead
  static async getVideosAsStreams(videoIds: string[]): Promise<StreamData[]> {
    console.warn('getVideosAsStreams is deprecated. Use getChannelsAsStreams with channel IDs instead.');
    if (videoIds.length === 0) {
      return [];
    }
    
    try {
      const youtubeResponses = await YouTubeService.getVideosMetadata(videoIds);
      
      // IMPORTANT: Only show videos that are currently live
      const liveResponses = youtubeResponses.filter(response => 
        response.success && response.data && response.data.isLiveNow
      );
      
      return liveResponses.map(response => 
        this.transformToStreamData(response.data)
      );
    } catch (error) {
      console.error('Error fetching videos as streams:', error);
      return [];
    }
  }
  
  private static transformToStreamData(data: YouTubeMetadata): StreamData {
    // Use live duration if available, otherwise calculate from start time
    const duration = data.liveDuration || this.calculateDuration(data.actualStartTime);
    
    // Limit tags to fit in UI (take first 2-3 most relevant tags)
    const limitedTags = data.tags?.slice(0, 3) || [];
    
    return {
      id: data.videoId,
      title: data.title || 'Untitled Stream',
      channelName: data.channelName || 'Unknown Channel',
      channelId: data.channelId, // Include channel ID if available
      viewers: data.concurrentViewers || 0,
      thumbnail: this.getBestThumbnail(data.thumbnails),
      category: this.getCategoryFromTags(limitedTags),
      isLive: data.isLiveNow,
      duration,
      tags: limitedTags,
      videoId: data.videoId,
      actualStartTime: data.actualStartTime,
      description: data.description || ''
    };
  }

  private static getBestThumbnail(thumbnails: YouTubeMetadata['thumbnails']): string {
    if (!thumbnails || thumbnails.length === 0) {
      return '/default-thumbnail.jpg';
    }
    
    // Sort by resolution (width * height) and get the best one
    const sortedThumbnails = thumbnails
      .filter(thumb => thumb.url && thumb.width && thumb.height)
      .sort((a, b) => (b.width * b.height) - (a.width * a.height));
    
    return sortedThumbnails[0]?.url || thumbnails[0]?.url || '/default-thumbnail.jpg';
  }

  private static getCategoryFromTags(tags: string[]): string {
    if (!tags || tags.length === 0) return 'Live Stream';
    
    // Try to determine category from tags
    const firstTag = tags[0].toLowerCase();
    
    if (firstTag.includes('lofi') || firstTag.includes('music') || firstTag.includes('jazz')) return 'Music';
    if (firstTag.includes('game') || firstTag.includes('gaming')) return 'Gaming';
    if (firstTag.includes('study') || firstTag.includes('learn')) return 'Education';
    if (firstTag.includes('news') || firstTag.includes('live news')) return 'News';
    if (firstTag.includes('talk') || firstTag.includes('chat')) return 'Talk';
    
    return 'Live Stream';
  }

  
  private static calculateDuration(startTime: string | null): string {
    if (!startTime) return '0m';
    
    try {
      const start = new Date(startTime);
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      
      if (diffMs < 0) return '0m';
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    } catch {
      return '0m';
    }
  }
  
  static async getLiveStreamsFromAllUsers(): Promise<StreamData[]> {
    console.warn('getLiveStreamsFromAllUsers is deprecated. Use getLiveStreamsFromAllChannels instead.');
    return await this.getLiveStreamsFromAllChannels();
  }

  static async getLiveStreamsFromAllChannels(): Promise<StreamData[]> {
    try {
      // Get channel IDs from all users in the database
      const allUserChannels = await this.getAllUsersChannelIds();
      
      console.log(`🔍 Found ${allUserChannels.length} channel IDs from user database`);
      
      if (allUserChannels.length === 0) {
        console.log('⚠️ No channel IDs found in user database');
        return [];
      }
      
      // Get live streams from user channels only
      return await this.getChannelsLiveStreams(allUserChannels);
    } catch (error) {
      console.error('Error fetching live streams from all channels:', error);
      return [];
    }
  }

  static async getLiveStreamsForAllUsers(): Promise<StreamData[]> {
    console.warn('getLiveStreamsForAllUsers is deprecated. Use getLiveStreamsFromAllChannels instead.');
    return await this.getLiveStreamsFromAllChannels();
  }
  
  static async getLiveStreamsForUser(userId: string): Promise<StreamData[]> {
    try {
      const userChannels = await this.getCurrentUserChannelIds(userId);
      return await this.getChannelsLiveStreams(userChannels);
    } catch (error) {
      console.error('Error fetching live streams for user:', error);
      return [];
    }
  }
}