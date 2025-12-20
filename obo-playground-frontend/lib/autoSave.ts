/**
 * Auto-Save Service
 * Handles automatic saving to IndexedDB and syncing with backend
 */

import { indexedDBService } from './indexedDB';
import { connectionMonitor } from './connectionMonitor';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AutoSaveOptions {
  projectId: string;
  onSaveToLocal?: () => void;
  onSaveToBackend?: () => void;
  onSyncError?: (error: Error) => void;
  autoSaveInterval?: number; // milliseconds
}

class AutoSaveService {
  private saveTimers: Map<string, NodeJS.Timeout> = new Map();
  private syncQueue: Set<string> = new Set();
  private isSyncing: boolean = false;

  /**
   * Start auto-save for a project
   */
  startAutoSave(code: string, options: AutoSaveOptions): void {
    const {
      projectId,
      onSaveToLocal,
      autoSaveInterval = 5000, // 5 seconds default
    } = options;

    // Clear existing timer for this project
    this.stopAutoSave(projectId);

    // Save immediately to local storage
    this.saveToLocal(projectId, code, options);

    // Set up auto-save timer
    const timer = setInterval(() => {
      this.saveToLocal(projectId, code, options);
    }, autoSaveInterval);

    this.saveTimers.set(projectId, timer);
  }

  /**
   * Stop auto-save for a project
   */
  stopAutoSave(projectId: string): void {
    const timer = this.saveTimers.get(projectId);
    if (timer) {
      clearInterval(timer);
      this.saveTimers.delete(projectId);
    }
  }

  /**
   * Save code to local IndexedDB
   */
  private async saveToLocal(
    projectId: string,
    code: string,
    options: AutoSaveOptions
  ): Promise<void> {
    try {
      await indexedDBService.saveCode(projectId, code, true);
      
      if (options.onSaveToLocal) {
        options.onSaveToLocal();
      }

      // Add to sync queue if online
      if (connectionMonitor.isOnline()) {
        this.syncQueue.add(projectId);
        this.processSyncQueue(options);
      }
    } catch (error) {
      console.error('Failed to save to IndexedDB:', error);
      if (options.onSyncError) {
        options.onSyncError(error as Error);
      }
    }
  }

  /**
   * Process sync queue (upload to backend)
   */
  private async processSyncQueue(options: AutoSaveOptions): Promise<void> {
    // Prevent concurrent syncing
    if (this.isSyncing || !connectionMonitor.isOnline()) {
      return;
    }

    this.isSyncing = true;

    try {
      // Get all projects that need syncing
      const projectsToSync = Array.from(this.syncQueue);

      for (const projectId of projectsToSync) {
        try {
          await this.syncToBackend(projectId, options);
          this.syncQueue.delete(projectId);
        } catch (error) {
          console.error(`Failed to sync project ${projectId}:`, error);
          // Keep in queue for next attempt
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync project code to backend
   */
  private async syncToBackend(
    projectId: string,
    options: AutoSaveOptions
  ): Promise<void> {
    try {
      // Get code from IndexedDB
      const projectCode = await indexedDBService.getCode(projectId);
      
      if (!projectCode) {
        console.warn(`No code found in IndexedDB for project ${projectId}`);
        return;
      }

      // Upload to backend
      await axios.patch(
        `${API_URL}/projects/${projectId}/content`,
        { code: projectCode.code },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      // Mark as synced in IndexedDB
      await indexedDBService.markAsSynced(projectId);

      console.log('Code synced to backend:', projectId);

      if (options.onSaveToBackend) {
        options.onSaveToBackend();
      }
    } catch (error) {
      console.error('Failed to sync to backend:', error);
      throw error;
    }
  }

  /**
   * Manual save to both local and backend
   */
  async saveNow(projectId: string, code: string, options: AutoSaveOptions): Promise<void> {
    // Save to local
    await indexedDBService.saveCode(projectId, code, true);
    
    if (options.onSaveToLocal) {
      options.onSaveToLocal();
    }

    // Try to sync to backend
    if (connectionMonitor.isOnline()) {
      try {
        await this.syncToBackend(projectId, options);
      } catch (error) {
        console.error('Manual sync failed:', error);
        if (options.onSyncError) {
          options.onSyncError(error as Error);
        }
      }
    } else {
      // Add to queue for later
      this.syncQueue.add(projectId);
    }
  }

  /**
   * Load code from local storage
   */
  async loadFromLocal(projectId: string): Promise<string | null> {
    try {
      const projectCode = await indexedDBService.getCode(projectId);
      return projectCode?.code || null;
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Sync all unsynced projects when connection is restored
   */
  async syncAllUnsynced(options: Partial<AutoSaveOptions> = {}): Promise<void> {
    try {
      const unsyncedProjects = await indexedDBService.getUnsyncedProjects();
      
      console.log(`📤 Syncing ${unsyncedProjects.length} unsynced projects...`);

      for (const project of unsyncedProjects) {
        try {
          await this.syncToBackend(project.projectId, options as AutoSaveOptions);
        } catch (error) {
          console.error(`Failed to sync project ${project.projectId}:`, error);
        }
      }

      console.log('✅ All projects synced');
    } catch (error) {
      console.error('Failed to sync unsynced projects:', error);
    }
  }

  /**
   * Clean up all timers
   */
  cleanup(): void {
    this.saveTimers.forEach((timer) => clearInterval(timer));
    this.saveTimers.clear();
    this.syncQueue.clear();
  }
}

// Export singleton instance
export const autoSaveService = new AutoSaveService();
