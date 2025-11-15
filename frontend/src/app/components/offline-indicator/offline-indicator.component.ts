import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { OfflineService } from '../../services/offline.service';

@Component({
  selector: 'app-offline-indicator',
  template: `
    <div class="offline-indicator" [class.offline]="!isOnline" [class.online]="isOnline">
      <div class="indicator-dot"></div>
      <span class="indicator-text">
        {{ isOnline ? 'En ligne' : 'Hors ligne' }}
      </span>
      <span class="sync-status" *ngIf="!isOnline && hasPendingOperations">
        ({{ pendingOperationsCount }} en attente)
      </span>
    </div>
  `,
  styles: [`
    .offline-indicator {
      position: fixed;
      top: 90px;
      right: 24px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .offline-indicator.online {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .offline-indicator.offline {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      animation: pulse 2s infinite;
    }

    .indicator-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: currentColor;
    }

    .sync-status {
      font-size: 12px;
      opacity: 0.8;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    @media (max-width: 768px) {
      .offline-indicator {
        top: 80px;
        right: 16px;
        padding: 6px 10px;
        font-size: 12px;
      }
    }
  `]
})
export class OfflineIndicatorComponent implements OnInit, OnDestroy {
  isOnline = true;
  hasPendingOperations = false;
  pendingOperationsCount = 0;

  private subscriptions: Subscription[] = [];

  constructor(private offlineService: OfflineService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.offlineService.isOnline$.subscribe(isOnline => {
        this.isOnline = isOnline;
      })
    );

    this.subscriptions.push(
      this.offlineService.pendingOperations$.subscribe(operations => {
        this.hasPendingOperations = operations.length > 0;
        this.pendingOperationsCount = operations.length;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}