import { logger } from '@/lib/logger';
// Offline queue for PWA hour submissions
// Uses IndexedDB to store pending requests when offline

const DB_NAME = 'elevate-offline-queue';
const DB_VERSION = 1;
const STORE_NAME = 'pending-requests';

interface QueuedRequest {
  id?: number;
  url: string;
  method: string;
  body: string;
  timestamp: number;
  type: 'hours' | 'lesson' | 'other';
}

class OfflineQueue {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async add(request: Omit<QueuedRequest, 'id'>): Promise<number> {
    if (!this.db) await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const addRequest = store.add(request);

      addRequest.onsuccess = () => resolve(addRequest.result as number);
      addRequest.onerror = () => reject(addRequest.error);
    });
  }

  async getAll(): Promise<QueuedRequest[]> {
    if (!this.db) await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async remove(id: number): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async count(): Promise<number> {
    if (!this.db) await this.init();
    if (!this.db) return 0;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async sync(): Promise<{ synced: number; failed: number }> {
    const requests = await this.getAll();
    let synced = 0;
    let failed = 0;

    for (const req of requests) {
      try {
        const response = await fetch(req.url, {
          method: req.method,
          headers: { 'Content-Type': 'application/json' },
          body: req.body,
        });

        if (response.ok) {
          await this.remove(req.id!);
          synced++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
      }
    }

    return { synced, failed };
  }
}

export const offlineQueue = new OfflineQueue();

// Hook for React components
export function useOfflineQueue() {
  const queueRequest = async (
    url: string,
    method: string,
    body: any,
    type: QueuedRequest['type'] = 'other',
  ): Promise<boolean> => {
    // Try online first
    if (navigator.onLine) {
      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        return response.ok;
      } catch (error) {
        logger.error('Error:', error);
      }
    }

    // Queue for later
    await offlineQueue.add({
      url,
      method,
      body: JSON.stringify(body),
      timestamp: Date.now(),
      type,
    });

    // Register for background sync if available
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(`sync-${type}`);
    }

    return true; // Queued successfully
  };

  const syncPending = async () => {
    return offlineQueue.sync();
  };

  const getPendingCount = async () => {
    return offlineQueue.count();
  };

  return { queueRequest, syncPending, getPendingCount };
}
