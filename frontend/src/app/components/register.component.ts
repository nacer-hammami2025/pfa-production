import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  template: `
    <div class="register-wrapper">
      <!-- Extraordinary Animated Background -->
      <div class="extraordinary-background">
        <!-- Nebula Layers -->
        <div class="nebula-layer nebula-1"></div>
        <div class="nebula-layer nebula-2"></div>
        <div class="nebula-layer nebula-3"></div>
        
        <!-- Magical Orbs -->
        <div class="magical-orb orb-1"></div>
        <div class="magical-orb orb-2"></div>
        <div class="magical-orb orb-3"></div>
        <div class="magical-orb orb-4"></div>
        <div class="magical-orb orb-5"></div>
        
        <!-- Stardust -->
        <div class="stardust">
          <div class="star" *ngFor="let i of [].constructor(25); index as idx"></div>
        </div>
        
        <!-- Aurora Waves -->
        <div class="aurora">
          <div class="aurora-wave aurora-1"></div>
          <div class="aurora-wave aurora-2"></div>
          <div class="aurora-wave aurora-3"></div>
          <div class="aurora-wave aurora-4"></div>
        </div>
        
        <!-- Constellation -->
        <div class="constellation">
          <div class="constellation-node node-1"></div>
          <div class="constellation-node node-2"></div>
          <div class="constellation-node node-3"></div>
          <div class="constellation-node node-4"></div>
          <div class="constellation-node node-5"></div>
          <div class="constellation-line line-1"></div>
          <div class="constellation-line line-2"></div>
          <div class="constellation-line line-3"></div>
          <div class="constellation-line line-4"></div>
        </div>
      </div>

      <div class="register-container">
        <!-- Extraordinary Brand Section -->
        <div class="extraordinary-brand">
          <!-- Magical Logo -->
          <div class="magical-logo">
            <div class="logo-aura"></div>
            <div class="logo-core">
              <div class="core-ring ring-1"></div>
              <div class="core-ring ring-2"></div>
              <div class="core-ring ring-3"></div>
              <div class="logo-symbol">🚀</div>
            </div>
            <div class="logo-particles">
              <div class="logo-particle" *ngFor="let i of [].constructor(8)"></div>
            </div>
          </div>

          <!-- Miracle Title -->
          <div class="miracle-title">
            <div class="title-glow"></div>
            <span class="title-word word-1">Rejoignez</span>
            <span class="title-word word-2">L'Aventure</span>
            <span class="title-word word-3">Magique</span>
          </div>

          <!-- Cosmic Subtitle -->
          <div class="cosmic-subtitle">
            <span class="subtitle-icon">✨</span>
            <span class="subtitle-text">Créez votre compte pour débuter cette expérience extraordinaire</span>
            <span class="subtitle-sparkles">⭐</span>
          </div>

          <!-- Legendary Features -->
          <div class="legendary-features">
            <div class="legend-feature">
              <div class="feature-trail"></div>
              <div class="feature-orb">🎯</div>
              <div class="feature-content">
                <div class="feature-title">Gestion Révolutionnaire</div>
                <div class="feature-desc">Organisez vos projets avec une efficacité légendaire</div>
              </div>
            </div>
            <div class="legend-feature">
              <div class="feature-trail"></div>
              <div class="feature-orb">⚡</div>
              <div class="feature-content">
                <div class="feature-title">Performance Extraordinaire</div>
                <div class="feature-desc">Vitesse d'exécution au-delà de l'imaginable</div>
              </div>
            </div>
            <div class="legend-feature">
              <div class="feature-trail"></div>
              <div class="feature-orb">🎨</div>
              <div class="feature-content">
                <div class="feature-title">Interface Miraculeuse</div>
                <div class="feature-desc">Design qui transcende les attentes</div>
              </div>
            </div>
            <div class="legend-feature">
              <div class="feature-trail"></div>
              <div class="feature-orb">🔮</div>
              <div class="feature-content">
                <div class="feature-title">Expérience Magique</div>
                <div class="feature-desc">Chaque interaction devient un enchantement</div>
              </div>
            </div>
          </div>

          <!-- Brand Stats -->
          <div class="brand-stats">
            <div class="stat-item">
              <span class="stat-number">10K+</span>
              <span class="stat-label">Utilisateurs Magiques</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">99.9%</span>
              <span class="stat-label">Satisfaction</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">24/7</span>
              <span class="stat-label">Support Divin</span>
            </div>
          </div>
        </div>

        <!-- Register Form Section -->
        <div class="register-form-section">
          <div class="form-container">
            <div class="form-header">
              <h2 class="form-title">Création de Compte</h2>
              <p class="form-subtitle">Rejoignez notre communauté extraordinaire</p>
            </div>

            <form (ngSubmit)="submit()" #f="ngForm" class="register-form">
              <div class="form-group">
                <label for="name" class="form-label">✨ Nom Complet</label>
                <input
                  id="name"
                  type="text"
                  [(ngModel)]="name"
                  name="name"
                  required
                  minlength="2"
                  #nameInput="ngModel"
                  class="form-input"
                  placeholder="Votre nom magique"
                  [class.error]="nameInput.invalid && (nameInput.dirty || nameInput.touched)"
                />
                <div *ngIf="nameInput.invalid && (nameInput.dirty || nameInput.touched)" class="error-message">
                  Le nom doit contenir au moins 2 caractères
                </div>
              </div>

              <div class="form-group">
                <label for="email" class="form-label">⚡ Adresse Email</label>
                <input
                  id="email"
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$"
                  #emailInput="ngModel"
                  class="form-input"
                  placeholder="votre.email@exemple.com"
                  [class.error]="emailInput.invalid && (emailInput.dirty || emailInput.touched)"
                />
                <div *ngIf="emailInput.invalid && (emailInput.dirty || emailInput.touched)" class="error-message">
                  Veuillez entrer une adresse email valide
                </div>
              </div>

              <div class="form-group">
                <label for="password" class="form-label">🔮 Mot de Passe</label>
                <input
                  id="password"
                  type="password"
                  [(ngModel)]="password"
                  name="password"
                  required
                  minlength="6"
                  #passwordInput="ngModel"
                  class="form-input"
                  placeholder="Créez un mot de passe sécurisé"
                  [class.error]="passwordInput.invalid && (passwordInput.dirty || passwordInput.touched)"
                />
                <div *ngIf="passwordInput.invalid && (passwordInput.dirty || passwordInput.touched)" class="error-message">
                  Le mot de passe doit contenir au moins 6 caractères
                </div>
              </div>

              <button
                type="submit"
                [disabled]="f.invalid || isLoading"
                class="form-button">
                <span *ngIf="!isLoading">🚀 Créer Mon Compte Magique</span>
                <span *ngIf="isLoading" class="loading-spinner">
                  <span class="spinner-icon">⏳</span>
                  Création en cours...
                </span>
              </button>

              <div *ngIf="error" class="error-alert">
                <span class="alert-icon">⚠️</span>
                {{ error }}
              </div>
            </form>

            <div class="form-footer">
              <p class="footer-text">
                Vous avez déjà un compte ?
                <a routerLink="/login" class="footer-link">Connectez-vous ici</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  error = '';
  isLoading = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async submit() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.error = '';

    try {
      console.log('📝 Tentative d\'inscription:', { name: this.name, email: this.email });
      const ok = await this.auth.register(this.name, this.email, this.password);
      if (ok) {
        console.log('✅ Inscription réussie, redirection...');
        this.router.navigate(['/tasks']);
      } else {
        this.error = 'Échec de l\'inscription, veuillez réessayer';
        console.error('❌ Inscription échouée: pas de token reçu');
      }
    } catch (err: any) {
      this.error = err.message || 'Une erreur est survenue lors de l\'inscription';
      console.error('❌ Erreur d\'inscription:', err);
    } finally {
      this.isLoading = false;
    }
  }
}
