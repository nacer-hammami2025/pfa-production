import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <div class="admin-layout">
      <!-- SIDEBAR NAVIGATION -->
      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <div class="admin-badge">
            <i class="icon">👑</i>
            <div class="badge-text">
              <span class="title">Espace Admin</span>
              <span class="subtitle">Administration</span>
            </div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <i class="icon">📊</i>
            <span>Dashboard</span>
          </a>
          <a routerLink="/admin/users" routerLinkActive="active" class="nav-item">
            <i class="icon">👥</i>
            <span>Utilisateurs</span>
          </a>
          <a routerLink="/admin/teams" routerLinkActive="active" class="nav-item">
            <i class="icon">🏢</i>
            <span>Équipes</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <button class="back-btn" (click)="goBack()">
            <i class="icon">←</i>
            <span>Retour</span>
          </button>
        </div>
      </aside>

      <!-- MAIN CONTENT -->
      <main class="admin-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: calc(100vh - 70px);
      background: #f7fafc;
    }

    .admin-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      min-height: calc(100vh - 70px);
      gap: 0;
    }

    .admin-sidebar {
      background: linear-gradient(180deg, #2d3748 0%, #1a202c 100%);
      color: white;
      display: flex;
      flex-direction: column;
      box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 70px;
      height: calc(100vh - 70px);
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 32px 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .admin-badge {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: linear-gradient(135deg, rgba(245, 101, 101, 0.2), rgba(229, 62, 62, 0.2));
      border-radius: 12px;
      border: 1px solid rgba(245, 101, 101, 0.3);
    }

    .admin-badge .icon {
      font-size: 32px;
      filter: drop-shadow(0 4px 8px rgba(245, 101, 101, 0.4));
      font-style: normal;
    }

    .badge-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .badge-text .title {
      font-size: 18px;
      font-weight: 700;
      color: #fef5f5;
    }

    .badge-text .subtitle {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
    }

    .sidebar-nav {
      flex: 1;
      padding: 24px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      font-size: 15px;
      font-weight: 500;
      border-radius: 10px;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .nav-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(180deg, #f56565, #e53e3e);
      transform: scaleY(0);
      transition: transform 0.3s ease;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      transform: translateX(4px);
    }

    .nav-item.active {
      background: linear-gradient(135deg, rgba(245, 101, 101, 0.15), rgba(229, 62, 62, 0.15));
      color: #fef5f5;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(245, 101, 101, 0.2);
    }

    .nav-item.active::before {
      transform: scaleY(1);
    }

    .nav-item .icon {
      font-size: 20px;
      font-style: normal;
    }

    .sidebar-footer {
      padding: 24px 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 15px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .back-btn .icon {
      font-size: 18px;
      font-style: normal;
    }

    .admin-content {
      padding: 32px;
      background: #f7fafc;
      overflow-y: auto;
      animation: fadeIn 0.4s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 1024px) {
      .admin-layout {
        grid-template-columns: 1fr;
      }

      .admin-sidebar {
        display: none;
      }

      .admin-content {
        padding: 20px;
      }
    }

    @media (max-width: 768px) {
      .admin-content {
        padding: 16px;
      }
    }

    .admin-sidebar::-webkit-scrollbar {
      width: 6px;
    }

    .admin-sidebar::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.2);
    }

    .admin-sidebar::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
    }

    .admin-sidebar::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {}

  goBack() {
    this.router.navigate(['/tasks']);
  }
}
