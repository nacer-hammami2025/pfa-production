import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { NotificationService, Notification } from '../services/notification.service';
import { PersistentNotificationService, PersistentNotification } from '../services/persistent-notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications',
  template: `
    <div class="notifications-panel-v2" [class.visible]="true">
      <div class="notifications-header-v2">
        <h3>🎉 Notifications Émotionnelles</h3>
        <button class="close-btn-v2" (click)="closePanelEvent()">
          <i class="close-icon">✕</i>
        </button>
      </div>

      <div class="notifications-content-v2">
        <div *ngIf="getAllNotifications().length === 0" class="no-notifications-v2">
          <div class="no-notifications-icon">🔔</div>
          <p>Aucune notification pour le moment</p>
          <span class="no-notifications-subtitle">Nous vous avertirons dès qu'il y aura du nouveau ! 🚀</span>
        </div>

        <!-- Notifications Persistantes (Backend) -->
        <div *ngFor="let notification of persistentNotifications" class="notification-item-v2"
             [class.unread]="!notification.read"
             [class.success-v2]="isSuccessNotificationPersistent(notification)"
             [class.rejection-v2]="isRejectionNotificationPersistent(notification)"
             [class.celebration-v2]="isCelebrationNotificationPersistent(notification)"
             (click)="markPersistentAsRead(notification)">
          <div class="notification-icon-v2" 
               [class.success-icon-v2]="isSuccessNotificationPersistent(notification)" 
               [class.rejection-icon-v2]="isRejectionNotificationPersistent(notification)">
            <span [innerHTML]="getNotificationIconPersistent(notification.type)"></span>
            <div *ngIf="isSuccessNotificationPersistent(notification)" class="confetti-burst-v2"></div>
          </div>
          <div class="notification-content-v2">
            <div class="notification-title-v2">{{ getEmotionalTitlePersistent(notification) }}</div>
            <div class="notification-message-v2">{{ getEmotionalMessagePersistent(notification) }}</div>
            <div class="notification-time-v2">{{ getTimeAgoPersistent(notification.createdAt) }}</div>
            <div *ngIf="isSuccessNotificationPersistent(notification)" class="emotional-note-v2 success-note-v2">
              🎉 Félicitations ! Votre équipe va pouvoir commencer ses projets ! 🚀
            </div>
            <div *ngIf="isRejectionNotificationPersistent(notification)" class="emotional-note-v2 rejection-note-v2">
              💙 Ne vous découragez pas, ajustez votre demande et réessayez ! ✨
            </div>
          </div>
          <div class="notification-actions-v2" *ngIf="notification.action">
            <button class="action-btn-v2" 
                    [class.success-action-v2]="isSuccessNotificationPersistent(notification)"
                    [class.rejection-action-v2]="isRejectionNotificationPersistent(notification)"
                    (click)="executePersistentAction(notification)">
              {{ notification.action.label }}
            </button>
          </div>
        </div>

        <!-- Notifications Locales -->
        <div *ngFor="let notification of notifications" class="notification-item-v2"
             [class.unread]="!notification.read"
             [class.success-v2]="isSuccessNotification(notification)"
             [class.rejection-v2]="isRejectionNotification(notification)"
             [class.celebration-v2]="isCelebrationNotification(notification)"
             (click)="markAsRead(notification)">
          <div class="notification-icon" [class.success-icon]="isSuccessNotification(notification)" [class.rejection-icon]="isRejectionNotification(notification)">
            <span [innerHTML]="getNotificationIcon(notification.type)"></span>
            <div *ngIf="isSuccessNotification(notification)" class="confetti-burst"></div>
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ getEmotionalTitle(notification) }}</div>
            <div class="notification-message">{{ getEmotionalMessage(notification) }}</div>
            <div class="notification-time">{{ getTimeAgo(notification.timestamp) }}</div>
            <div *ngIf="isSuccessNotification(notification)" class="emotional-note success-note">
              🎉 Félicitations ! Votre équipe va pouvoir commencer ses projets ! 🚀
            </div>
            <div *ngIf="isRejectionNotification(notification)" class="emotional-note rejection-note">
              💙 Ne vous découragez pas, ajustez votre demande et réessayez ! ✨
            </div>
          </div>
          <div class="notification-actions" *ngIf="notification.action">
            <button class="action-btn" 
                    [class.success-action]="isSuccessNotification(notification)"
                    [class.rejection-action]="isRejectionNotification(notification)"
                    (click)="executeAction(notification)">
              {{ notification.action.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="notifications-footer" *ngIf="notifications.length > 0">
        <button class="clear-all-btn" (click)="clearAllNotifications()">
          Clear All
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* 🎉 NOTIFICATIONS V2 - FORCE OVERRIDE CACHE 🎉 */
    .notifications-panel-v2 {
      position: fixed !important;
      top: 80px !important;
      right: 20px !important;
      width: 420px !important;
      max-height: 650px !important;
      background: #ffffff !important;
      border-radius: 20px !important;
      border: 2px solid #667eea !important;
      box-shadow: 0 30px 80px rgba(102, 126, 234, 0.25) !important;
      z-index: 10001 !important;
      overflow: hidden !important;
      transform: translateY(0) scale(1) !important;
      opacity: 1 !important;
      visibility: visible !important;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
      backdrop-filter: none !important;
    }

    .notifications-header-v2 {
      padding: 1.5rem !important;
      background: linear-gradient(135deg, #667eea, #764ba2) !important;
      color: white !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
    }

    .notifications-header-v2 h3 {
      margin: 0 !important;
      font-size: 1.3rem !important;
      font-weight: 700 !important;
      color: white !important;
    }

    .close-btn-v2 {
      background: rgba(255, 255, 255, 0.2) !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
      color: white !important;
      padding: 0.6rem !important;
      border-radius: 12px !important;
      cursor: pointer !important;
      transition: all 0.3s ease !important;
    }

    .close-btn-v2:hover {
      background: rgba(255, 255, 255, 0.3) !important;
      transform: scale(1.05) !important;
    }

    .notifications-content-v2 {
      max-height: 500px !important;
      overflow-y: auto !important;
      padding: 0 !important;
    }

    .notification-item-v2 {
      padding: 1.5rem !important;
      border-bottom: 1px solid #f1f5f9 !important;
      display: flex !important;
      align-items: flex-start !important;
      gap: 1rem !important;
      cursor: pointer !important;
      transition: all 0.3s ease !important;
      background: white !important;
    }

    .notification-item-v2:hover {
      background: rgba(102, 126, 234, 0.05) !important;
    }

    .notification-item-v2.success-v2 {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%) !important;
      border-left: 4px solid #22c55e !important;
      animation: successPulse 2s ease-in-out !important;
    }

    .notification-item-v2.rejection-v2 {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 127, 0.05) 100%) !important;
      border-left: 4px solid #ef4444 !important;
      animation: gentleGlow 3s ease-in-out !important;
    }

    .notification-icon-v2 {
      flex-shrink: 0 !important;
      width: 50px !important;
      height: 50px !important;
      border-radius: 50% !important;
      background: linear-gradient(45deg, #667eea, #764ba2) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 1.5rem !important;
      position: relative !important;
    }

    .success-icon-v2 {
      background: linear-gradient(45deg, #22c55e, #16a34a) !important;
      animation: successBounce 1s ease-out !important;
    }

    .rejection-icon-v2 {
      background: linear-gradient(45deg, #ef4444, #dc2626) !important;
      animation: empathyGlow 2s ease-in-out !important;
    }

    .notification-content-v2 {
      flex: 1 !important;
      min-width: 0 !important;
    }

    .notification-title-v2 {
      font-weight: 700 !important;
      color: #1a202c !important;
      margin-bottom: 0.5rem !important;
      font-size: 1.1rem !important;
    }

    .notification-message-v2 {
      color: #4a5568 !important;
      font-size: 0.95rem !important;
      line-height: 1.5 !important;
      margin-bottom: 0.5rem !important;
    }

    .notification-time-v2 {
      color: #718096 !important;
      font-size: 0.85rem !important;
    }

    .emotional-note-v2 {
      margin-top: 1rem !important;
      padding: 1rem !important;
      border-radius: 12px !important;
      font-size: 0.9rem !important;
      font-weight: 600 !important;
      line-height: 1.4 !important;
    }

    .success-note-v2 {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1)) !important;
      color: #166534 !important;
      border: 2px solid rgba(34, 197, 94, 0.3) !important;
      animation: joyPulse 3s ease-in-out infinite !important;
    }

    .rejection-note-v2 {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.1)) !important;
      color: #4338ca !important;
      border: 2px solid rgba(99, 102, 241, 0.3) !important;
      animation: comfortGlow 4s ease-in-out infinite !important;
    }

    .confetti-burst-v2 {
      position: absolute !important;
      top: -10px !important;
      right: -10px !important;
      width: 20px !important;
      height: 20px !important;
      background: radial-gradient(circle, #fbbf24, #f59e0b) !important;
      border-radius: 50% !important;
      animation: confetti 2s ease-out infinite !important;
    }

    @keyframes successPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3); }
    }

    @keyframes gentleGlow {
      0%, 100% { box-shadow: 0 4px 15px rgba(239, 68, 68, 0.1); }
      50% { box-shadow: 0 8px 25px rgba(239, 68, 68, 0.2); }
    }

    @keyframes successBounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }

    @keyframes empathyGlow {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(1.15); }
    }

    @keyframes confetti {
      0% { transform: scale(0) rotate(0deg); opacity: 1; }
      50% { transform: scale(1.5) rotate(180deg); opacity: 0.8; }
      100% { transform: scale(0) rotate(360deg); opacity: 0; }
    }

    @keyframes joyPulse {
      0%, 100% { background-color: rgba(34, 197, 94, 0.15); }
      50% { background-color: rgba(34, 197, 94, 0.25); }
    }

    @keyframes comfortGlow {
      0%, 100% { background-color: rgba(99, 102, 241, 0.15); }
      50% { background-color: rgba(99, 102, 241, 0.25); }
    }

    /* ANCIENS STYLES */
    .notifications-panel {
      position: fixed;
      top: 80px;
      right: 20px;
      width: 420px;
      max-height: 650px;
      background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(255, 255, 255, 0.5);
      z-index: 1001;
      overflow: hidden;
      transform: translateY(-20px) scale(0.95);
      opacity: 0;
      visibility: hidden;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .notifications-panel.visible {
      transform: translateY(0) scale(1);
      opacity: 1;
      visibility: visible;
    }

    :host-context(.dark-mode) .notifications-panel {
      background: linear-gradient(145deg, #2d3748 0%, #1a202c 100%);
      border: 1px solid #4a5568;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
    }

    .notifications-header {
      padding: 1.5rem 1.5rem 1rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.03), rgba(118, 75, 162, 0.02));
      position: relative;
    }

    .notifications-header::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.3), transparent);
    }

    :host-context(.dark-mode) .notifications-header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.03));
    }

    .notifications-header h3 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: titleShimmer 3s ease-in-out infinite;
    }

    @keyframes titleShimmer {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(1.2); }
    }

    :host-context(.dark-mode) .notifications-header h3 {
      background: linear-gradient(135deg, #818cf8, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .close-btn {
      background: linear-gradient(45deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.05));
      border: 1px solid rgba(102, 126, 234, 0.2);
      cursor: pointer;
      padding: 0.6rem;
      border-radius: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      color: #667eea;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
    }

    .close-btn:hover {
      background: linear-gradient(45deg, rgba(102, 126, 234, 0.15), rgba(118, 75, 162, 0.1));
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .close-icon {
      font-size: 1.2rem;
      font-weight: 700;
    }

    .notifications-content {
      max-height: 450px;
      overflow-y: auto;
    }

    .no-notifications {
      padding: 3rem 2rem;
      text-align: center;
      color: #6c757d;
    }

    :host-context(.dark-mode) .no-notifications {
      color: #a0aec0;
    }

    .no-notifications-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .no-notifications p {
      margin: 0 0 0.5rem 0;
      font-weight: 500;
    }

    .no-notifications-subtitle {
      font-size: 0.9rem;
      opacity: 0.7;
    }

    .notification-item {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
    }

    .notification-item:hover {
      background: rgba(102, 126, 234, 0.05);
    }

    .notification-item.unread {
      background: rgba(102, 126, 234, 0.1);
      border-left: 3px solid #667eea;
    }

    :host-context(.dark-mode) .notification-item {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-mode) .notification-item:hover {
      background: rgba(102, 126, 234, 0.1);
    }

    :host-context(.dark-mode) .notification-item.unread {
      background: rgba(102, 126, 234, 0.15);
    }

    .notification-icon {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(45deg, #667eea, #764ba2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.25rem;
      font-size: 0.95rem;
    }

    :host-context(.dark-mode) .notification-title {
      color: #e2e8f0;
    }

    .notification-message {
      color: #6c757d;
      font-size: 0.9rem;
      line-height: 1.4;
      margin-bottom: 0.5rem;
    }

    :host-context(.dark-mode) .notification-message {
      color: #a0aec0;
    }

    .notification-time {
      font-size: 0.8rem;
      color: #95a5a6;
    }

    :host-context(.dark-mode) .notification-time {
      color: #718096;
    }

    .notification-actions {
      flex-shrink: 0;
    }

    .action-btn {
      padding: 0.375rem 0.75rem;
      border: 1px solid #667eea;
      background: transparent;
      color: #667eea;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .action-btn:hover {
      background: #667eea;
      color: white;
    }

    .notifications-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    :host-context(.dark-mode) .notifications-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .clear-all-btn {
      background: none;
      border: none;
      color: #e74c3c;
      cursor: pointer;
      font-size: 0.9rem;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      transition: all 0.3s ease;
    }

    .clear-all-btn:hover {
      background: rgba(231, 76, 60, 0.1);
    }

    /* Scrollbar styling */
    .notifications-content::-webkit-scrollbar {
      width: 6px;
    }

    .notifications-content::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 3px;
    }

    .notifications-content::-webkit-scrollbar-thumb {
      background: rgba(102, 126, 234, 0.3);
      border-radius: 3px;
    }

    .notifications-content::-webkit-scrollbar-thumb:hover {
      background: rgba(102, 126, 234, 0.5);
    }

    :host-context(.dark-mode) .notifications-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-mode) .notifications-content::-webkit-scrollbar-thumb {
      background: rgba(102, 126, 234, 0.5);
    }

    :host-context(.dark-mode) .notifications-content::-webkit-scrollbar-thumb:hover {
      background: rgba(102, 126, 234, 0.7);
    }

    /* Notifications Émotionnelles PROFESSIONNELLES */
    .notification-item.success {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
      border-left: 4px solid #22c55e;
      animation: successPulse 2s ease-in-out;
    }

    .notification-item.rejection {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 127, 0.05) 100%);  
      border-left: 4px solid #ef4444;
      animation: gentleGlow 3s ease-in-out;
    }

    .notification-item.celebration {
      background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%);
      border-left: 4px solid #fbbf24;
      animation: celebrationShine 1.5s ease-in-out infinite;
    }

    .success-icon {
      background: linear-gradient(45deg, #22c55e, #16a34a) !important;
      animation: successBounce 1s ease-out;
      position: relative;
      overflow: visible;
    }

    .rejection-icon {
      background: linear-gradient(45deg, #ef4444, #dc2626) !important;
      animation: empathyGlow 2s ease-in-out;
    }

    .confetti-burst {
      position: absolute;
      top: -5px;
      right: -5px;
      width: 10px;
      height: 10px;
      background: radial-gradient(circle, #fbbf24, #f59e0b);
      border-radius: 50%;
      animation: confetti 2s ease-out;
    }

    .emotional-note {
      margin-top: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 500;
      line-height: 1.4;
    }

    .success-note {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.05));
      color: #166534;
      border: 1px solid rgba(34, 197, 94, 0.2);
      animation: joyPulse 3s ease-in-out infinite;
    }

    .rejection-note {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.05));
      color: #4338ca;
      border: 1px solid rgba(99, 102, 241, 0.2);
      animation: comfortGlow 4s ease-in-out infinite;
    }

    .action-btn.success-action {
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      font-weight: 600;
      animation: successButtonGlow 2s ease-in-out infinite;
    }

    .action-btn.rejection-action {
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white;
      font-weight: 600;
      animation: encouragementPulse 3s ease-in-out infinite;
    }

    /* Animations Émotionnelles */
    @keyframes successPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.02); box-shadow: 0 8px 25px rgba(34, 197, 94, 0.3); }
    }

    @keyframes gentleGlow {
      0%, 100% { box-shadow: 0 4px 15px rgba(239, 68, 68, 0.1); }
      50% { box-shadow: 0 8px 25px rgba(239, 68, 68, 0.2); }
    }

    @keyframes celebrationShine {
      0%, 100% { transform: scale(1); filter: brightness(1); }
      50% { transform: scale(1.01); filter: brightness(1.1); }
    }

    @keyframes successBounce {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }

    @keyframes empathyGlow {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(1.15); }
    }

    @keyframes confetti {
      0% { transform: scale(0) rotate(0deg); opacity: 1; }
      50% { transform: scale(1.5) rotate(180deg); opacity: 0.8; }
      100% { transform: scale(0) rotate(360deg); opacity: 0; }
    }

    @keyframes joyPulse {
      0%, 100% { background-color: rgba(34, 197, 94, 0.1); }
      50% { background-color: rgba(34, 197, 94, 0.15); }
    }

    @keyframes comfortGlow {
      0%, 100% { background-color: rgba(99, 102, 241, 0.1); }
      50% { background-color: rgba(99, 102, 241, 0.15); }
    }

    @keyframes successButtonGlow {
      0%, 100% { box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3); }
      50% { box-shadow: 0 8px 25px rgba(34, 197, 94, 0.5); }
    }

    @keyframes encouragementPulse {
      0%, 100% { box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3); }
      50% { box-shadow: 0 8px 25px rgba(99, 102, 241, 0.5); }
    }

    /* Dark Mode pour les émotions */
    :host-context(.dark-mode) .success-note {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1));
      color: #4ade80;
    }

    :host-context(.dark-mode) .rejection-note {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.1));
      color: #818cf8;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .notifications-panel {
        top: 75px;
        right: 10px;
        left: 10px;
        width: auto;
        max-height: 500px;
      }

      .notification-item {
        padding: 1rem;
        gap: 0.75rem;
      }

      .notification-icon {
        width: 35px;
        height: 35px;
        font-size: 1rem;
      }

      .emotional-note {
        padding: 0.5rem 0.75rem;
        font-size: 0.8rem;
      }
    }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  persistentNotifications: PersistentNotification[] = [];
  private subscription?: Subscription;
  private persistentSubscription?: Subscription;

  @Output() closePanel = new EventEmitter<void>();

  constructor(
    private notificationService: NotificationService,
    private persistentNotificationService: PersistentNotificationService
  ) {}

  ngOnInit() {
    // Charger les notifications locales
    this.subscription = this.notificationService.getNotifications().subscribe(
      notifications => {
        this.notifications = notifications;
      }
    );
    
    // Charger les notifications persistantes du backend
    this.loadPersistentNotifications();
  }

  loadPersistentNotifications() {
    this.persistentNotificationService.loadPersistentNotifications().subscribe({
      next: (response: any) => {
        const notifications = response.notifications || response;
        this.persistentNotifications = notifications;
        console.log('🔔 Notifications persistantes chargées:', notifications.length);
      },
      error: (error) => {
        console.error('❌ Erreur chargement notifications:', error);
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.persistentSubscription) {
      this.persistentSubscription.unsubscribe();
    }
  }

  closePanelEvent() {
    this.closePanel.emit();
  }

  markAsRead(notification: Notification) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id);
    }
  }

  executeAction(notification: Notification) {
    if (notification.action && notification.action.callback) {
      notification.action.callback();
    }
  }

  clearAllNotifications() {
    this.notificationService.clearAll();
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      case 'task': return '📋';
      default: return '🔔';
    }
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const timeDiff = now.getTime() - new Date(timestamp).getTime();

    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  }

  // 🎉 MÉTHODES ÉMOTIONNELLES PROFESSIONNELLES 🎉
  isSuccessNotification(notification: Notification): boolean {
    return notification.message?.toLowerCase().includes('accepté') || 
           notification.message?.toLowerCase().includes('approuvé') ||
           notification.message?.toLowerCase().includes('validé') ||
           notification.title?.toLowerCase().includes('accepté') ||
           notification.title?.toLowerCase().includes('approuvé') ||
           notification.type === 'success';
  }

  isRejectionNotification(notification: Notification): boolean {
    return notification.message?.toLowerCase().includes('rejeté') || 
           notification.message?.toLowerCase().includes('refusé') ||
           notification.message?.toLowerCase().includes('décliné') ||
           notification.title?.toLowerCase().includes('rejeté') ||
           notification.title?.toLowerCase().includes('refusé') ||
           (notification.type === 'error' && !this.isSuccessNotification(notification));
  }

  isCelebrationNotification(notification: Notification): boolean {
    return notification.message?.toLowerCase().includes('création') || 
           notification.message?.toLowerCase().includes('nouvelle équipe') ||
           this.isSuccessNotification(notification);
  }

  getEmotionalTitle(notification: Notification): string {
    if (this.isSuccessNotification(notification)) {
      return `🎉 ${notification.title} - Félicitations !`;
    }
    if (this.isRejectionNotification(notification)) {
      return `💙 ${notification.title} - Ne perdez pas espoir`;
    }
    return `✨ ${notification.title}`;
  }

  getEmotionalMessage(notification: Notification): string {
    if (this.isSuccessNotification(notification)) {
      return `${notification.message} 🚀 Votre demande a été acceptée avec succès !`;
    }
    if (this.isRejectionNotification(notification)) {
      return `${notification.message} 💪 Ajustez votre demande et réessayez, vous pouvez y arriver !`;
    }
    return notification.message;
  }

  // 🎉 MÉTHODES POUR NOTIFICATIONS PERSISTANTES (Backend) 🎉
  getAllNotifications(): (Notification | PersistentNotification)[] {
    return [...this.persistentNotifications, ...this.notifications];
  }

  isSuccessNotificationPersistent(notification: PersistentNotification): boolean {
    return notification.message?.toLowerCase().includes('approuvée') || 
           notification.message?.toLowerCase().includes('accepté') ||
           notification.title?.toLowerCase().includes('approuvée') ||
           notification.title?.toLowerCase().includes('accepté') ||
           notification.type === 'success';
  }

  isRejectionNotificationPersistent(notification: PersistentNotification): boolean {
    return notification.message?.toLowerCase().includes('rejetée') || 
           notification.message?.toLowerCase().includes('refusé') ||
           notification.title?.toLowerCase().includes('rejetée') ||
           notification.title?.toLowerCase().includes('refusé') ||
           (notification.type === 'warning' && !this.isSuccessNotificationPersistent(notification));
  }

  isCelebrationNotificationPersistent(notification: PersistentNotification): boolean {
    return this.isSuccessNotificationPersistent(notification);
  }

  getEmotionalTitlePersistent(notification: PersistentNotification): string {
    if (this.isSuccessNotificationPersistent(notification)) {
      return `🎉 ${notification.title} - Félicitations !`;
    }
    if (this.isRejectionNotificationPersistent(notification)) {
      return `💙 ${notification.title} - Ne perdez pas espoir`;
    }
    return `✨ ${notification.title}`;
  }

  getEmotionalMessagePersistent(notification: PersistentNotification): string {
    return notification.message; // Le backend envoie déjà les messages émotionnels
  }

  getNotificationIconPersistent(type: string): string {
    switch (type) {
      case 'success': return '🎉';
      case 'warning': return '💙';
      case 'error': return '❌';
      case 'info': return '📢';
      default: return '🔔';
    }
  }

  getTimeAgoPersistent(timestamp: string): string {
    const now = new Date();
    const timeDiff = now.getTime() - new Date(timestamp).getTime();

    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  }

  markPersistentAsRead(notification: PersistentNotification) {
    if (!notification.read) {
      this.persistentNotificationService.markAsRead(notification._id).subscribe({
        next: () => {
          notification.read = true;
          console.log('✅ Notification marquée comme lue');
        },
        error: (error) => {
          console.error('❌ Erreur marquage notification:', error);
        }
      });
    }
  }

  executePersistentAction(notification: PersistentNotification) {
    if (notification.action && notification.action.callback) {
      // Ici on pourrait naviguer vers la route spécifiée
      console.log('🔗 Action:', notification.action.callback);
      // Exemple: this.router.navigate([notification.action.callback]);
    }
  }
}