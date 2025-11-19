import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar">
      <div class="nav-items">
        
        <!-- Éléments normaux pour tous les utilisateurs -->
        <a routerLink="/dashboard" class="nav-link">
          <i class="fas fa-tachometer-alt"></i> Tableau de Bord
        </a>
        
        <a routerLink="/tasks" class="nav-link">
          <i class="fas fa-tasks"></i> Mes Tâches
        </a>
        
        <a routerLink="/projects" class="nav-link">
          <i class="fas fa-project-diagram"></i> Projets
        </a>

        <!-- Éléments admin (visible uniquement pour les admins) -->
        <div *appAdminOnly>
          <a routerLink="/admin" class="nav-link admin-link">
            <i class="fas fa-crown"></i> Administration
          </a>
        </div>

        <!-- Alternative : lien admin avec vérification manuelle -->
        <a (click)="checkAdminAccess()" class="nav-link admin-link" 
           [class.disabled]="!isAdmin()">
          <i class="fas fa-shield-alt"></i> Panneau Admin
        </a>

      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-items {
      display: flex;
      gap: 1rem;
    }

    .nav-link {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-link:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }

    .admin-link {
      background: linear-gradient(135deg, #ff6b6b, #ee5a52);
      font-weight: 600;
    }

    .admin-link.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .admin-link.disabled:hover {
      background: linear-gradient(135deg, #ff6b6b, #ee5a52);
      transform: none;
    }
  `]
})
export class NavbarComponent {

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user && user.role === 'admin';
  }

  checkAdminAccess(): void {
    if (this.isAdmin()) {
      // L'utilisateur est admin, rediriger vers admin
      this.router.navigate(['/admin']);
    } else {
      // L'utilisateur n'est pas admin, afficher message professionnel
      this.notificationService.showProfessionalAccessMessage();
    }
  }
}