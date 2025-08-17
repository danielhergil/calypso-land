import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  Timestamp,
  setDoc,
  getDoc 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from './config';
import { Team, StreamProfile } from '../types';
import { compressImage, getLogoCompressionOptions } from '../utils/imageCompression';

interface MetricData {
  action: 'stream' | 'record';
  use: number;
  createdAt: Timestamp;
}

export const firestoreService = {
  // User Metrics
  async getUserMetrics(userId: string): Promise<MetricData[]> {
    const metricsRef = collection(db, 'users', userId, 'metrics');
    const q = query(metricsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MetricData & { id: string }));
  },

  async addUserMetric(userId: string, metric: Omit<MetricData, 'createdAt'>): Promise<void> {
    const metricsRef = collection(db, 'users', userId, 'metrics');
    await addDoc(metricsRef, {
      ...metric,
      createdAt: Timestamp.now()
    });
  },

  // User Teams
  async getUserTeams(userId: string): Promise<Team[]> {
    const teamsRef = collection(db, 'users', userId, 'teams');
    const snapshot = await getDocs(teamsRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team & { id: string }));
  },

  async addUserTeam(userId: string, team: Omit<Team, 'createdAt'>): Promise<void> {
    const teamsRef = collection(db, 'users', userId, 'teams');
    await addDoc(teamsRef, {
      ...team,
      createdAt: Timestamp.now().toDate().toISOString()
    });
  },

  async updateUserTeam(userId: string, teamId: string, team: Partial<Team>): Promise<void> {
    const teamRef = doc(db, 'users', userId, 'teams', teamId);
    await updateDoc(teamRef, team);
  },

  async deleteUserTeam(userId: string, teamId: string): Promise<void> {
    const teamRef = doc(db, 'users', userId, 'teams', teamId);
    await deleteDoc(teamRef);
  },

  // User Stream Profiles
  async getUserProfiles(userId: string): Promise<StreamProfile[]> {
    const profilesRef = collection(db, 'users', userId, 'settings_profiles');
    const snapshot = await getDocs(profilesRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StreamProfile & { id: string }));
  },

  async addUserProfile(userId: string, profile: StreamProfile): Promise<void> {
    const profilesRef = collection(db, 'users', userId, 'settings_profiles');
    await addDoc(profilesRef, profile);
  },

  async updateUserProfile(userId: string, profileId: string, profile: Partial<StreamProfile>): Promise<void> {
    const profileRef = doc(db, 'users', userId, 'settings_profiles', profileId);
    await updateDoc(profileRef, profile);
  },

  async deleteUserProfile(userId: string, profileId: string): Promise<void> {
    const profileRef = doc(db, 'users', userId, 'settings_profiles', profileId);
    await deleteDoc(profileRef);
  },

  // User Document
  async createUserDocument(userId: string, userData: { email: string; role?: string }): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      createdAt: Timestamp.now()
    }, { merge: true });
  },

  async getUserDocument(userId: string): Promise<{ email: string; role?: string; createdAt: Timestamp } | null> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? userDoc.data() as { email: string; role?: string; createdAt: Timestamp } : null;
  },

  async getAllUsers(): Promise<Array<{ id: string; email: string; role?: string; createdAt: Timestamp }>> {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as { id: string; email: string; role?: string; createdAt: Timestamp }));
  },

  async updateUserRole(userId: string, role: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { role });
  },

  async deleteUser(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
  },

  // Enhanced user deletion with Cloud Functions support (when available)
  async deleteUserCompletely(userId: string, useCloudFunction: boolean = false): Promise<{ 
    firestoreDeleted: boolean; 
    authDeleted: boolean; 
    message: string 
  }> {
    try {
      if (useCloudFunction) {
        // This would call a Cloud Function for complete deletion
        // Requires Firebase Admin SDK deployment
        // const { deleteUserCompletely } = await import('./adminFunctions');
        // const result = await deleteUserCompletely({ userId });
        
        throw new Error('Cloud Functions not implemented. Use server-side Firebase Admin SDK.');
      } else {
        // Client-side deletion (Firestore only)
        const userRef = doc(db, 'users', userId);
        await deleteDoc(userRef);
        
        return {
          firestoreDeleted: true,
          authDeleted: false,
          message: 'User data deleted from database. Authentication account still exists.'
        };
      }
    } catch (error) {
      throw error;
    }
  },

  async getAllUsersWithMetrics(): Promise<Array<{ id: string; email: string; role?: string; createdAt: Timestamp; totalStreamTime: number; totalRecordingTime: number; numberOfTeams: number }>> {
    const users = await this.getAllUsers();
    
    const usersWithMetrics = await Promise.all(
      users.map(async (user) => {
        try {
          const [metrics, teams] = await Promise.all([
            this.getUserMetrics(user.id),
            this.getUserTeams(user.id)
          ]);

          const streamMetrics = metrics.filter(m => m.action === 'stream');
          const recordMetrics = metrics.filter(m => m.action === 'record');
          
          const totalStreamTime = streamMetrics.reduce((acc, m) => acc + m.use, 0);
          const totalRecordingTime = recordMetrics.reduce((acc, m) => acc + m.use, 0);

          return {
            ...user,
            totalStreamTime,
            totalRecordingTime,
            numberOfTeams: teams.length
          };
        } catch {
          return {
            ...user,
            totalStreamTime: 0,
            totalRecordingTime: 0,
            numberOfTeams: 0
          };
        }
      })
    );

    return usersWithMetrics;
  },

  // Storage Services
  async uploadTeamLogo(userId: string, teamName: string, file: File): Promise<string> {
    // Compress the image before uploading
    const compressedFile = await compressImage(file, getLogoCompressionOptions());
    
    // Use .jpg extension for compressed images (they're converted to JPEG)
    const fileName = `${teamName}.jpg`;
    const logoRef = ref(storage, `${userId}/${fileName}`);
    
    await uploadBytes(logoRef, compressedFile);
    const downloadURL = await getDownloadURL(logoRef);
    return downloadURL;
  },

  async deleteTeamLogo(userId: string, teamName: string, logoUrl: string): Promise<void> {
    if (!logoUrl) return;
    
    // Extract file extension from URL or try both common formats
    const extensions = ['jpeg', 'jpg', 'png'];
    const deletePromises = extensions.map(async (ext) => {
      try {
        const fileName = `${teamName}.${ext}`;
        const logoRef = ref(storage, `${userId}/${fileName}`);
        await deleteObject(logoRef);
      } catch {
        // Ignore errors for files that don't exist
      }
    });
    
    await Promise.allSettled(deletePromises);
  },

  async replaceTeamLogo(userId: string, oldTeamName: string, newTeamName: string, file: File, oldLogoUrl?: string): Promise<string> {
    // Delete old logo if it exists and team name changed
    if (oldLogoUrl && oldTeamName !== newTeamName) {
      await this.deleteTeamLogo(userId, oldTeamName, oldLogoUrl);
    }
    
    // Upload new compressed logo
    return await this.uploadTeamLogo(userId, newTeamName, file);
  }
};