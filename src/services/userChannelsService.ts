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

  static async getAllUsersVideoIds(): Promise<string[]> {
    try {
      console.log('Note: getAllUsersVideoIds() requires admin permissions');
      console.log('For testing, returning empty array to use only current user data');
      
      // For testing, return empty array so we only use current user's video IDs
      return [];
    } catch (error) {
      console.error('Error fetching all users video IDs:', error);
      return [];
    }
  }
  
  
  static async getPublicChannelIds(): Promise<string[]> {
    // Return a curated list of public channel IDs to check for live streams
    console.log('Using curated public channel IDs for homepage');
    return [
      'UCSJ4gkVC6NrvII8umztf0Ow', // Lofi Girl - often has live streams
      'UCx4VtJ8gu_ZJKv4QfayYK4g', // Example channel - replace with your test channels
    ];
  }

  static async getPublicVideoIds(): Promise<string[]> {
    // For testing, return empty array to force using user data from database
    // This way we only use the actual video IDs from your database
    console.log('Using only user database video IDs (no public fallback)');
    return [];
  }
  
  static async getCurrentUserVideoIds(userId?: string): Promise<string[]> {
    if (!userId) {
      console.log('No user ID provided, returning empty array');
      return [];
    }
    
    try {
      console.log(`Fetching video IDs for current user: ${userId}`);
      const userData = await firestoreService.getUser(userId);
      console.log(`User data:`, userData);
      
      // Read from channel_ids.youtube array - treating them as video IDs for testing
      // Your database: { channel_ids: { youtube: ["qwerty", "phi36uzvzD0", "VCWupbQE1Jw"] } }
      const userVideoIds = userData?.channel_ids?.youtube || [];
      console.log(`Video IDs from channel_ids.youtube for user:`, userVideoIds);
      
      if (Array.isArray(userVideoIds)) {
        return userVideoIds;
      } else if (userVideoIds) {
        return [userVideoIds];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching current user video IDs:', error);
      return [];
    }
  }
  
  static async getChannelsLiveStreams(channelIds: string[]): Promise<StreamData[]> {
    if (channelIds.length === 0) return [];
    
    try {
      const youtubeResponses = await YouTubeService.getChannelsMetadata(channelIds);
      
      return youtubeResponses
        .filter(response => response.data.isLiveNow)
        .map(response => this.transformToStreamData(response.data));
    } catch (error) {
      console.error('Error fetching channels live streams:', error);
      return [];
    }
  }
  
  // For testing with videos instead of channels - ONLY SHOWS LIVE STREAMS
  static async getVideosAsStreams(videoIds: string[]): Promise<StreamData[]> {
    if (videoIds.length === 0) {
      console.log('No video IDs provided');
      return [];
    }
    
    try {
      console.log('Fetching videos as streams for IDs:', videoIds);
      const youtubeResponses = await YouTubeService.getVideosMetadata(videoIds);
      console.log('YouTube responses received:', youtubeResponses);
      
      // IMPORTANT: Only show videos that are currently live
      const liveResponses = youtubeResponses.filter(response => 
        response.success && response.data && response.data.isLiveNow
      );
      console.log(`Filtered to ${liveResponses.length} live videos out of ${youtubeResponses.length} total`);
      
      const streamData = liveResponses.map(response => 
        this.transformToStreamData(response.data)
      );
      console.log('Live stream data:', streamData);
      
      return streamData;
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
    try {
      console.log('Getting all user video data and filtering for live streams...');
      
      // Get video IDs from all users + public video IDs  
      const [allUserVideos, publicVideos] = await Promise.all([
        this.getAllUsersVideoIds(),
        this.getPublicVideoIds()
      ]);
      
      const allVideoIds = [...new Set([...allUserVideos, ...publicVideos])];
      console.log('Fetching cached data for video IDs:', allVideoIds);
      
      if (allVideoIds.length === 0) {
        console.log('No video IDs to fetch');
        return [];
      }
      
      // Get cached data for all videos - this already tells us if they're live
      const youtubeResponses = await YouTubeService.getVideosMetadata(allVideoIds);
      
      // Simply filter for videos that are currently live and transform them
      const liveStreams = youtubeResponses
        .filter(response => response.success && response.data.isLiveNow)
        .map(response => this.transformToStreamData(response.data));
      
      console.log(`Showing ${liveStreams.length} live streams (filtered from ${allVideoIds.length} total videos)`);
      return liveStreams;
    } catch (error) {
      console.error('Error fetching live streams from all users:', error);
      return [];
    }
  }

  static async getLiveStreamsFromAllChannels(): Promise<StreamData[]> {
    // For now, redirect to video-based method for testing
    console.log('Redirecting to video-based live stream detection for testing...');
    return await this.getLiveStreamsFromAllUsers();
  }

  static async getLiveStreamsForAllUsers(): Promise<StreamData[]> {
    try {
      const allChannels = await this.getAllUsersChannels();
      return await this.getChannelsLiveStreams(allChannels);
    } catch (error) {
      console.error('Error fetching live streams for all users:', error);
      return [];
    }
  }
  
  static async getLiveStreamsForUser(userId: string): Promise<StreamData[]> {
    try {
      const userChannels = await this.getUserChannels(userId);
      return await this.getChannelsLiveStreams(userChannels);
    } catch (error) {
      console.error('Error fetching live streams for user:', error);
      return [];
    }
  }
}