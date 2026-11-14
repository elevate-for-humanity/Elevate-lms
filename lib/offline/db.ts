// IndexedDB wrapper for offline data storage

const DB_NAME = 'elevate-lms';
const DB_VERSION = 1;

export interface OfflineProgress {
  id?: number;
  courseId: string;
  lessonId: string;
  progress: number;
  completed: boolean;
  timestamp: number;
  synced: boolean;
}

export interface OfflineCourse {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  lessons: any[];
  cachedAt: number;
}

export interface OfflineVideo {
  id: string;
  lessonId: string;
  blob: Blob;
  cachedAt: number;
}

class OfflineDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Progress store
        if (!db.objectStoreNames.contains('progress')) {
          const progressStore = db.createObjectStore('progress', {
            keyPath: 'id',
            autoIncrement: true,
          });
          progressStore.createIndex('courseId', 'courseId', { unique: false });
          progressStore.createIndex('synced', 'synced', { unique: false });
        }

        // Courses store
        if (!db.objectStoreNames.contains('courses')) {
          db.createObjectStore('courses', { keyPath: 'id' });
        }

        // Videos store
        if (!db.objectStoreNames.contains('videos')) {
          const videoStore = db.createObjectStore('videos', { keyPath: 'id' });
          videoStore.createIndex('lessonId', 'lessonId', { unique: false });
        }

        // Queue store for background sync
        if (!db.objectStoreNames.contains('sync-queue')) {
          const queueStore = db.createObjectStore('sync-queue', {
            keyPath: 'id',
            autoIncrement: true,
          });
          queueStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) throw new Error('Database not initialized');
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Progress methods
  async saveProgress(progress: OfflineProgress): Promise<number> {
    const store = this.getStore('progress', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(progress);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getProgress(courseId: string): Promise<OfflineProgress[]> {
    const store = this.getStore('progress');
    const index = store.index('courseId');
    return new Promise((resolve, reject) => {
      const request = index.getAll(courseId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedProgress(): Promise<OfflineProgress[]> {
    const store = this.getStore('progress');
    const index = store.index('synced');
    return new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only(false));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async markProgressSynced(id: number): Promise<void> {
    const store = this.getStore('progress', 'readwrite');
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const progress = getRequest.result;
        if (progress) {
          progress.synced = true;
          const putRequest = store.put(progress);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Course methods
  async saveCourse(course: OfflineCourse): Promise<void> {
    const store = this.getStore('courses', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(course);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCourse(id: string): Promise<OfflineCourse | undefined> {
    const store = this.getStore('courses');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCourses(): Promise<OfflineCourse[]> {
    const store = this.getStore('courses');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCourse(id: string): Promise<void> {
    const store = this.getStore('courses', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Video methods
  async saveVideo(video: OfflineVideo): Promise<void> {
    const store = this.getStore('videos', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(video);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getVideo(id: string): Promise<OfflineVideo | undefined> {
    const store = this.getStore('videos');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteVideo(id: string): Promise<void> {
    const store = this.getStore('videos', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue methods
  async addToSyncQueue(data: Record<string, any>): Promise<number> {
    const store = this.getStore('sync-queue', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add({
        ...data,
        timestamp: Date.now(),
      });
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<any[]> {
    const store = this.getStore('sync-queue');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearSyncQueue(): Promise<void> {
    const store = this.getStore('sync-queue', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromSyncQueue(id: number): Promise<void> {
    const store = this.getStore('sync-queue', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Storage management
  async getStorageEstimate(): Promise<{ usage: number; quota: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return { usage: 0, quota: 0 };
  }

  async clearAllData(): Promise<void> {
    if (!this.db) return;

    const storeNames = ['progress', 'courses', 'videos', 'sync-queue'];
    const promises = storeNames.map((storeName) => {
      const store = this.getStore(storeName, 'readwrite');
      return new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  }
}

// Singleton instance
let dbInstance: OfflineDB | null = null;

export async function getDB(): Promise<OfflineDB> {
  if (!dbInstance) {
    dbInstance = new OfflineDB();
    await dbInstance.init();
  }
  return dbInstance;
}

export default OfflineDB;
