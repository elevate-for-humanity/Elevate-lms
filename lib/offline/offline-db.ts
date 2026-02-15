/**
 * Offline Database - IndexedDB wrapper for offline functionality
 */


const DB_NAME = 'efh-offline-db';
const DB_VERSION = 1;

export interface OfflineAction {
  id?: number;
  type?: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
  retryCount: number;
}

export interface CachedData {
  id?: number;
  key: string;
  data: any;
  timestamp: number;
  expiresAt?: number;
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

        // Store for offline actions (POST/PUT/DELETE requests)
        if (!db.objectStoreNames.contains('offline-actions')) {
          const actionStore = db.createObjectStore('offline-actions', {
            keyPath: 'id',
            autoIncrement: true,
          });
          actionStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for cached data
        if (!db.objectStoreNames.contains('cached-data')) {
          const dataStore = db.createObjectStore('cached-data', {
            keyPath: 'id',
            autoIncrement: true,
          });
          dataStore.createIndex('key', 'key', { unique: true });
          dataStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for course progress
        if (!db.objectStoreNames.contains('course-progress')) {
          const progressStore = db.createObjectStore('course-progress', {
            keyPath: 'id',
            autoIncrement: true,
          });
          progressStore.createIndex('courseId', 'courseId', { unique: false });
          progressStore.createIndex('lessonId', 'lessonId', { unique: false });
        }
      };
    });
  }

  // Offline Actions
  async addOfflineAction(action: Omit<OfflineAction, 'id'>): Promise<number> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ['offline-actions'],
        'readwrite'
      );
      const store = transaction.objectStore('offline-actions');
      const request = store.add(action);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as number);
    });
  }

  async getAllOfflineActions(): Promise<OfflineAction[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline-actions'], 'readonly');
      const store = transaction.objectStore('offline-actions');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async removeOfflineAction(id: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ['offline-actions'],
        'readwrite'
      );
      const store = transaction.objectStore('offline-actions');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Alias for compatibility with service worker
  async deleteOfflineAction(id: number): Promise<void> {
    return this.removeOfflineAction(id);
  }

  // Cached Data
  async setCachedData(
    key: string,
    data: Record<string, any>,
    expiresIn?: number
  ): Promise<void> {
    if (!this.db) await this.init();

    const cachedData: CachedData = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached-data'], 'readwrite');
      const store = transaction.objectStore('cached-data');
      const index = store.index('key');
      const getRequest = index.get(key);

      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (existing) {
          cachedData.id = existing.id;
          const updateRequest = store.put(cachedData);
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve();
        } else {
          const addRequest = store.add(cachedData);
          addRequest.onerror = () => reject(addRequest.error);
          addRequest.onsuccess = () => resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached-data'], 'readonly');
      const store = transaction.objectStore('cached-data');
      const index = store.index('key');
      const request = index.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // Check if expired
        if (result.expiresAt && result.expiresAt < Date.now()) {
          // Delete expired data
          this.deleteCachedData(key);
          resolve(null);
          return;
        }

        resolve(result.data);
      };
    });
  }

  async deleteCachedData(key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached-data'], 'readwrite');
      const store = transaction.objectStore('cached-data');
      const index = store.index('key');
      const getRequest = index.get(key);

      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (result) {
          const deleteRequest = store.delete(result.id);
          deleteRequest.onerror = () => reject(deleteRequest.error);
          deleteRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Course Progress (for offline learning)
  async saveCourseProgress(data: {
    courseId: string;
    lessonId: string;
    progress: number;
  }): Promise<void> {
    if (!this.db) await this.init();

    const { courseId, lessonId, progress } = data;
    const progressData = {
      courseId,
      lessonId,
      progress,
      timestamp: Date.now(),
      synced: false,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        ['course-progress'],
        'readwrite'
      );
      const store = transaction.objectStore('course-progress');
      const request = store.add(progressData);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getUnsyncedProgress(): Promise<any[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['course-progress'], 'readonly');
      const store = transaction.objectStore('course-progress');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result.filter((item: any) => !item.synced);
        resolve(results);
      };
    });
  }
}

export { OfflineDB };
export const offlineDB = new OfflineDB();
