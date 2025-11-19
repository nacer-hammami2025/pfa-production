import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-access-denied',
  template: `
    <div class="access-denied-container">
      <div class="access-denied-card">
        <!-- Icon animé -->
        <div class="icon-container">
          <div class="shield-icon">
            <i class="fas fa-shield-alt"></i>
          </div>
          <div class="warning-pulse"></div>
        </div>

        <!-- Titre principal -->
        <h1 class="main-title">Accès Restreint</h1>
        
        <!-- Message professionnel -->
        <div class="message-container">
          <p class="primary-message">
            Nous sommes désolés, mais vous n'avez pas les privilèges administrateur 
            nécessaires pour accéder à cette section.
          </p>
          
          <div class="info-box">
            <i class="fas fa-info-circle"></i>
            <div class="info-content">
              <strong>Compte actuel :</strong> Utilisateur Standard<br>
              <strong>Accès requis :</strong> Administrateur
            </div>
          </div>
        </div>

        <!-- Actions disponibles -->
        <div class="actions-container">
          <button class="btn btn-primary" (click)="goToDashboard()">
            <i class="fas fa-tachometer-alt"></i>
            Retour au Tableau de Bord
          </button>
          
          <button class="btn btn-secondary" (click)="contactAdmin()">
            <i class="fas fa-envelope"></i>
            Contacter un Administrateur
          </button>
        </div>

        <!-- Suggestions -->
        <div class="suggestions">
          <h3>Que puis-je faire ?</h3>
          <ul>
            <li><i class="fas fa-tasks"></i> Gérer mes tâches personnelles</li>
            <li><i class="fas fa-project-diagram"></i> Collaborer sur mes projets</li>
            <li><i class="fas fa-chart-line"></i> Consulter mes statistiques</li>
            <li><i class="fas fa-cog"></i> Modifier mes préférences</li>
          </ul>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Si vous pensez qu'il s'agit d'une erreur, veuillez contacter votre administrateur système.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .access-denied-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .access-denied-card {
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 600px;
      width: 100%;
      padding: 40px;
      text-align: center;
      animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .icon-container {
      position: relative;
      margin-bottom: 30px;
    }

    .shield-icon {
      font-size: 80px;
      color: #ff6b6b;
      margin-bottom: 20px;
      animation: bounce 2s infinite;
    }

    .warning-pulse {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 120px;
      height: 120px;
      border: 3px solid rgba(255, 107, 107, 0.3);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
      }
      40% {
        transform: translateY(-10px);
      }
      60% {
        transform: translateY(-5px);
      }
    }

    @keyframes pulse {
      0% {
        transform: translate(-50%, -50%) scale(0.8);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(1.4);
        opacity: 0;
      }
    }

    .main-title {
      font-size: 2.5rem;
      color: #2c3e50;
      margin-bottom: 20px;
      font-weight: 700;
    }

    .message-container {
      margin-bottom: 30px;
    }

    .primary-message {
      font-size: 1.1rem;
      color: #555;
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #007bff;
      padding: 15px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      text-align: left;
      margin: 20px 0;
    }

    .info-box i {
      color: #007bff;
      font-size: 1.5rem;
      margin-right: 15px;
    }

    .info-content {
      color: #6c757d;
      font-size: 0.95rem;
    }

    .actions-container {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 12px 25px;
      border: none;
      border-radius: 50px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s ease;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #007bff, #0056b3);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 123, 255, 0.3);
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(108, 117, 125, 0.3);
    }

    .suggestions {
      background: #f8f9fa;
      padding: 25px;
      border-radius: 15px;
      margin-bottom: 25px;
      text-align: left;
    }

    .suggestions h3 {
      color: #2c3e50;
      margin-bottom: 15px;
      text-align: center;
    }

    .suggestions ul {
      list-style: none;
      padding: 0;
    }

    .suggestions li {
      display: flex;
      align-items: center;
      padding: 8px 0;
      color: #555;
    }

    .suggestions li i {
      color: #28a745;
      margin-right: 10px;
      width: 20px;
    }

    .footer {
      color: #6c757d;
      font-size: 0.9rem;
      border-top: 1px solid #dee2e6;
      padding-top: 20px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .access-denied-card {
        padding: 30px 20px;
      }

      .main-title {
        font-size: 2rem;
      }

      .actions-container {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class AccessDeniedComponent {

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }

  contactAdmin() {
    // Vous pouvez personnaliser cette action
    window.location.href = 'mailto:admin@taskflow.com?subject=Demande d\'accès administrateur&body=Bonjour,%0D%0A%0D%0AJe souhaiterais obtenir des informations concernant l\'accès aux fonctionnalités administrateur.%0D%0A%0D%0ACordialement';
  }
}