import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { UserChannelsService } from './userChannelsService';

export class ChatCleanupService {
  private static cleanupInterval: NodeJS.Timeout | null = null;
  private static readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private static readonly MESSAGE_TTL = 2 * 60 * 60 * 1000; // 2 hours (in case stream detection fails)

  /**
   * Start the cleanup service that periodically removes chat messages
   * from streams that are no longer live
   */
  static startCleanupService(): void {
    if (this.cleanupInterval) {
      console.log('Chat cleanup service already running');
      return;
    }

    console.log('🧹 Starting chat cleanup service...');
    
    // Run cleanup immediately
    this.performCleanup();
    
    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Stop the cleanup service
   */
  static stopCleanupService(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🛑 Chat cleanup service stopped');
    }
  }

  /**
   * Perform the actual cleanup of chat messages
   */
  private static async performCleanup(): Promise<void> {
    try {
      console.log('🧹 Performing chat cleanup...');
      
      // Get all currently live streams
      const liveStreams = await UserChannelsService.getLiveStreamsFromAllChannels();
      const liveStreamIds = new Set(liveStreams.map(stream => stream.videoId));
      
      console.log(`📺 Found ${liveStreamIds.size} live streams`);
      
      // Get all chat messages
      const chatCollection = collection(db, 'liveChats');
      const chatSnapshot = await getDocs(chatCollection);
      
      if (chatSnapshot.empty) {
        console.log('💬 No chat messages to clean');
        return;
      }

      console.log(`💬 Found ${chatSnapshot.size} total chat messages`);
      
      const batch = writeBatch(db);
      let messagesToDelete = 0;
      const now = new Date();

      chatSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const messageStreamId = data.streamId;
        const messageTimestamp = data.timestamp;
        
        // Delete message if:
        // 1. Stream is no longer live, OR
        // 2. Message is older than TTL (safety fallback)
        const shouldDelete = !liveStreamIds.has(messageStreamId) || 
          this.isMessageExpired(messageTimestamp, now);
        
        if (shouldDelete) {
          batch.delete(doc(db, 'liveChats', docSnapshot.id));
          messagesToDelete++;
        }
      });

      if (messagesToDelete > 0) {
        await batch.commit();
        console.log(`🗑️ Cleaned up ${messagesToDelete} expired chat messages`);
      } else {
        console.log('✨ No messages needed cleanup');
      }
      
    } catch (error) {
      console.error('❌ Error during chat cleanup:', error);
    }
  }

  /**
   * Check if a message has expired based on TTL
   */
  private static isMessageExpired(messageTimestamp: any, now: Date): boolean {
    if (!messageTimestamp) return true;
    
    try {
      const messageDate = messageTimestamp instanceof Timestamp 
        ? messageTimestamp.toDate() 
        : new Date(messageTimestamp);
        
      return (now.getTime() - messageDate.getTime()) > this.MESSAGE_TTL;
    } catch (error) {
      // If we can't parse the timestamp, consider it expired
      return true;
    }
  }

  /**
   * Manually clean up messages for a specific stream
   * Useful when we know a stream has ended
   */
  static async cleanupStreamMessages(streamId: string): Promise<void> {
    try {
      console.log(`🧹 Cleaning up messages for stream: ${streamId}`);
      
      const chatCollection = collection(db, 'liveChats');
      const streamQuery = query(chatCollection, where('streamId', '==', streamId));
      const querySnapshot = await getDocs(streamQuery);
      
      if (querySnapshot.empty) {
        console.log(`💬 No messages found for stream: ${streamId}`);
        return;
      }

      const batch = writeBatch(db);
      querySnapshot.forEach((docSnapshot) => {
        batch.delete(doc(db, 'liveChats', docSnapshot.id));
      });

      await batch.commit();
      console.log(`🗑️ Cleaned up ${querySnapshot.size} messages for stream: ${streamId}`);
      
    } catch (error) {
      console.error(`❌ Error cleaning up stream messages for ${streamId}:`, error);
    }
  }

  /**
   * Clean up old messages (older than TTL) regardless of stream status
   */
  static async cleanupExpiredMessages(): Promise<void> {
    try {
      console.log('🧹 Cleaning up expired messages...');
      
      const chatCollection = collection(db, 'liveChats');
      const chatSnapshot = await getDocs(chatCollection);
      
      if (chatSnapshot.empty) {
        console.log('💬 No messages to check for expiration');
        return;
      }

      const batch = writeBatch(db);
      let expiredCount = 0;
      const now = new Date();

      chatSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        
        if (this.isMessageExpired(data.timestamp, now)) {
          batch.delete(doc(db, 'liveChats', docSnapshot.id));
          expiredCount++;
        }
      });

      if (expiredCount > 0) {
        await batch.commit();
        console.log(`🗑️ Cleaned up ${expiredCount} expired messages`);
      } else {
        console.log('✨ No expired messages found');
      }
      
    } catch (error) {
      console.error('❌ Error cleaning up expired messages:', error);
    }
  }
}