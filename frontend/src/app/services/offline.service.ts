import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, fromEvent, merge, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  public isOnline$ = this.isOnlineSubject.asObservable();

  private pendingOperationsSubject = new BehaviorSubject<any[]>([]);
  public pendingOperations$ = this.pendingOperationsSubject.asObservable();

  constructor() {
    // Listen for online/offline events
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).subscribe(isOnline => {
      this.isOnlineSubject.next(isOnline);
      if (isOnline) {
        this.syncPendingOperations();
      }
    });

    // Load pending operations from storage
    this.loadPendingOperations();
  }

  // Network status
  get isOnline(): boolean {
    return this.isOnlineSubject.value;
  }

  get isOffline(): boolean {
    return !this.isOnline;
  }

  // Check if we can make network requests
  canMakeRequest(): boolean {
    return this.isOnline;
  }

  // Queue operations for offline mode
  queueOperation(operation: PendingOperation): void {
    const operations = [...this.pendingOperationsSubject.value, operation];
    this.pendingOperationsSubject.next(operations);
    this.savePendingOperations(operations);
  }

  // Remove operation from queue
  removeOperation(operationId: string): void {
    const operations = this.pendingOperationsSubject.value.filter(op => op.id !== operationId);
    this.pendingOperationsSubject.next(operations);
    this.savePendingOperations(operations);
  }

  // Get pending operations count
  getPendingOperationsCount(): number {
    return this.pendingOperationsSubject.value.length;
  }

  // Sync pending operations when back online
  private async syncPendingOperations(): Promise<void> {
    const operations = [...this.pendingOperationsSubject.value];

    for (const operation of operations) {
      try {
        await this.executeOperation(operation);
        this.removeOperation(operation.id);
      } catch (error) {
        console.error('Failed to sync operation:', operation, error);
        // Keep failed operations in queue for retry
      }
    }
  }

  // Execute a pending operation
  private async executeOperation(operation: PendingOperation): Promise<any> {
    // This will be implemented by each service that needs offline support
    // For now, just resolve
    return Promise.resolve();
  }

  // Local storage helpers
  private savePendingOperations(operations: PendingOperation[]): void {
    try {
      localStorage.setItem('pendingOperations', JSON.stringify(operations));
    } catch (error) {
      console.error('Failed to save pending operations:', error);
    }
  }

  private loadPendingOperations(): void {
    try {
      const stored = localStorage.getItem('pendingOperations');
      if (stored) {
        const operations = JSON.parse(stored);
        this.pendingOperationsSubject.next(operations);
      }
    } catch (error) {
      console.error('Failed to load pending operations:', error);
    }
  }

  // Clear all pending operations (useful for testing or reset)
  clearPendingOperations(): void {
    this.pendingOperationsSubject.next([]);
    localStorage.removeItem('pendingOperations');
  }

  // Get network status as observable
  getNetworkStatus(): Observable<boolean> {
    return this.isOnline$;
  }

  // Force sync (useful for manual sync button)
  forceSync(): void {
    if (this.isOnline) {
      this.syncPendingOperations();
    }
  }
}

export interface PendingOperation {
  id: string;
  type: 'create_task' | 'update_task' | 'delete_task' | 'complete_task' | 'create_team' | 'update_team';
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}