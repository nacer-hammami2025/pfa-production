import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-access-denied',
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.css']
})
export class AccessDeniedComponent implements OnInit {
  reason: string = '';
  attemptedRole: string = '';
  message: string = '';
  userRole: string = '';
  userEmail: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Récupérer les paramètres de l'URL
    this.route.queryParams.subscribe(params => {
      this.reason = params['reason'] || 'access-denied';
      this.attemptedRole = params['attempted'] || 'admin';
      this.message = params['message'] || 'Accès refusé à cette section';
    });

    // Récupérer les informations utilisateur actuelles
    if (this.authService.isAuthenticated()) {
      this.userRole = this.authService.getUserRole() || 'user';
      const user = this.authService.getCurrentUser();
      this.userEmail = user?.email || 'Utilisateur';
    }
  }

  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'user': return 'Utilisateur';
      default: return role;
    }
  }

  getReasonMessage(): string {
    switch (this.reason) {
      case 'role-mismatch':
        return `Votre compte (${this.getRoleDisplayName(this.userRole)}) ne dispose pas des privilèges nécessaires pour accéder à l'espace ${this.getRoleDisplayName(this.attemptedRole)}.`;
      case 'insufficient-permissions':
        return 'Vous ne disposez pas des permissions suffisantes pour accéder à cette fonctionnalité.';
      case 'admin-only':
        return 'Cette section est réservée aux administrateurs uniquement.';
      default:
        return this.message;
    }
  }

  getRecommendation(): string {
    if (this.attemptedRole === 'admin' && this.userRole === 'user') {
      return 'Pour obtenir un accès administrateur, contactez votre responsable système ou l\'équipe IT.';
    }
    return 'Veuillez contacter votre administrateur pour plus d\'informations sur les accès.';
  }

  navigateToUserDashboard(): void {
    if (this.userRole === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/tasks']);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  contactSupport(): void {
    // Ici vous pouvez implémenter la logique de contact support
    window.location.href = 'mailto:support@votre-domaine.com?subject=Demande d\'accès administrateur';
  }
}