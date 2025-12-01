import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OAuthService } from '../services/oauth.service';

@Component({
  selector: 'app-oauth-callback',
  template: `
    <div class="oauth-callback-container">
      <div class="loading-content">
        <div class="spinner"></div>
        <h3>{{ loadingMessage }}</h3>
        <p>Please wait while we complete your authentication...</p>
        
        <div *ngIf="errorMessage" class="error-message">
          <i class="error-icon">⚠️</i>
          {{ errorMessage }}
          <button class="retry-btn" (click)="goToLogin()">Return to Login</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .oauth-callback-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: 'Inter', sans-serif;
    }

    .loading-content {
      text-align: center;
      background: white;
      padding: 3rem;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      max-width: 400px;
      width: 90%;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 2rem auto;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    h3 {
      color: #1a202c;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    p {
      color: #718096;
      margin-bottom: 2rem;
    }

    .error-message {
      color: #e53e3e;
      background: #fed7d7;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .retry-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s ease;
    }

    .retry-btn:hover {
      background: #5a67d8;
    }
  `]
})
export class OAuthCallbackComponent implements OnInit {
  loadingMessage = 'Authenticating...';
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private oAuthService: OAuthService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // Récupérer les paramètres de l'URL
      const code = this.route.snapshot.queryParams['code'];
      const state = this.route.snapshot.queryParams['state'];
      const error = this.route.snapshot.queryParams['error'];

      if (error) {
        throw new Error(`Authentication failed: ${error}`);
      }

      if (!code) {
        throw new Error('Authorization code not found');
      }

      // Déterminer le type d'authentification
      if (this.route.snapshot.url[0]?.path === 'microsoft') {
        this.loadingMessage = 'Completing Microsoft authentication...';
        await this.oAuthService.handleMicrosoftCallback(code, state || 'login');
      } else {
        throw new Error('Unknown OAuth provider');
      }

    } catch (error: any) {
      console.error('OAuth callback error:', error);
      this.errorMessage = error.message || 'Authentication failed. Please try again.';
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}