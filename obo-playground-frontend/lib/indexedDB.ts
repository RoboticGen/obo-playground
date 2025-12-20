/**
 * IndexedDB Service for Local Storage
 * Stores project code locally for offline access and auto-save
 */

interface ProjectCode {
  projectId: string;
  code: string;
  lastModified: number;
  lastSynced?: number;
  needsSync: boolean;
}

const DB_NAME = 'OBOPlaygroundDB';
const DB_VERSION = 1;
const STORE_NAME = 'projectCodes';

class IndexedDBService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'projectId' });
          objectStore.createIndex('lastModified', 'lastModified', { unique: false });
          objectStore.createIndex('needsSync', 'needsSync', { unique: false });
          console.log('📦 Created IndexedDB object store');
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Save project code to IndexedDB
   */
  async saveCode(projectId: string, code: string, needsSync: boolean = true): Promise<void> {
    await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const data: ProjectCode = {
        projectId,
        code,
        lastModified: Date.now(),
        needsSync,
      };

      // Get existing record to preserve lastSynced
      const getRequest = store.get(projectId);
      
      getRequest.onsuccess = () => {
        const existing = getRequest.result as ProjectCode | undefined;
        if (existing?.lastSynced) {
          data.lastSynced = existing.lastSynced;
        }

        const putRequest = store.put(data);

        putRequest.onsuccess = () => {
          console.log('💾 Code saved to IndexedDB:', projectId);
          resolve();
        };

        putRequest.onerror = () => {
          console.error('Failed to save code:', putRequest.error);
          reject(putRequest.error);
        };
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  /**
   * Get project code from IndexedDB
   */
  async getCode(projectId: string): Promise<ProjectCode | null> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(projectId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('Failed to get code:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Mark project as synced
   */
  async markAsSynced(projectId: string): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(projectId);

      getRequest.onsuccess = () => {
        const data = getRequest.result as ProjectCode | undefined;
        if (data) {
          data.needsSync = false;
          data.lastSynced = Date.now();

          const putRequest = store.put(data);
          
          putRequest.onsuccess = () => {
            console.log('Project marked as synced:', projectId);
            resolve();
          };

          putRequest.onerror = () => {
            reject(putRequest.error);
          };
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => {
        reject(getRequest.error);
      };
    });
  }

  /**
   * Get all projects that need syncing
   */
  async getUnsyncedProjects(): Promise<ProjectCode[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('needsSync');
      const request = index.getAll(IDBKeyRange.only(true));

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('Failed to get unsynced projects:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete project code from IndexedDB
   */
  async deleteCode(projectId: string): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(projectId);

      request.onsuccess = () => {
        console.log('🗑️ Code deleted from IndexedDB:', projectId);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete code:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all stored codes
   */
  async clearAll(): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('🗑️ All codes cleared from IndexedDB');
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to clear codes:', request.error);
        reject(request.error);
      };
    });
  }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();
export type { ProjectCode };
