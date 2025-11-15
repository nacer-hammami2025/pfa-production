import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo">
            <div class="logo-icon">📋</div>
          </div>
          <h1>Join Us Today</h1>
          <p class="auth-subtitle">Create your account to get started</p>
        </div>

        <form (ngSubmit)="submit()" #f="ngForm" class="auth-form">
          <div class="form-group">
            <label for="name" class="form-label">Full Name</label>
            <div class="input-wrapper">
              <i class="input-icon">👤</i>
              <input
                id="name"
                type="text"
                [(ngModel)]="name"
                name="name"
                required
                minlength="2"
                #nameInput="ngModel"
                class="form-input"
                placeholder="Enter your full name"
                [class.error]="nameInput.invalid && (nameInput.dirty || nameInput.touched)"
              />
            </div>
            <div *ngIf="nameInput.invalid && (nameInput.dirty || nameInput.touched)" class="error-message">
              Name must be at least 2 characters
            </div>
          </div>

          <div class="form-group">
            <label for="email" class="form-label">Email Address</label>
            <div class="input-wrapper">
              <i class="input-icon">✉️</i>
              <input
                id="email"
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$"
                #emailInput="ngModel"
                class="form-input"
                placeholder="Enter your email"
                [class.error]="emailInput.invalid && (emailInput.dirty || emailInput.touched)"
              />
            </div>
            <div *ngIf="emailInput.invalid && (emailInput.dirty || emailInput.touched)" class="error-message">
              Please enter a valid email address
            </div>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <div class="input-wrapper">
              <i class="input-icon">🔒</i>
              <input
                id="password"
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                minlength="6"
                #passwordInput="ngModel"
                class="form-input"
                placeholder="Create a password"
                [class.error]="passwordInput.invalid && (passwordInput.dirty || passwordInput.touched)"
              />
            </div>
            <div *ngIf="passwordInput.invalid && (passwordInput.dirty || passwordInput.touched)" class="error-message">
              Password must be at least 6 characters
            </div>
          </div>

          <button
            type="submit"
            [disabled]="f.invalid || isLoading"
            class="auth-btn primary">
            <span *ngIf="!isLoading">Create Account</span>
            <span *ngIf="isLoading" class="loading-spinner">
              <i class="spinner-icon">⏳</i>
              Creating account...
            </span>
          </button>

          <div *ngIf="error" class="alert alert-error">
            <i class="alert-icon">⚠️</i>
            {{ error }}
          </div>
        </form>

        <div class="auth-footer">
          <p>Already have an account?
            <a routerLink="/login" class="auth-link">Sign in here</a>
          </p>
        </div>
      </div>

      <div class="auth-bg">
        <div class="bg-pattern"></div>
        <div class="bg-content">
          <h2>Start Managing Tasks</h2>
          <p>Join thousands of users who organize their work efficiently with our platform.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .auth-card {
      flex: 1;
      max-width: 450px;
      background: white;
      border-radius: 20px;
      margin: 2rem;
      padding: 3rem 2.5rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .logo {
      margin-bottom: 1.5rem;
    }

    .logo-icon {
      font-size: 3rem;
      background: linear-gradient(45deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .auth-header h1 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 2rem;
      font-weight: 700;
    }

    .auth-subtitle {
      color: #6c757d;
      margin: 0;
      font-size: 1rem;
    }

    .auth-form {
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      color: #2c3e50;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .input-wrapper {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1rem;
      color: #adb5bd;
    }

    .form-input {
      width: 100%;
      padding: 1rem 1rem 1rem 3rem;
      border: 2px solid #e9ecef;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: #f8f9fa;
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-input.error {
      border-color: #e74c3c;
    }

    .error-message {
      color: #e74c3c;
      font-size: 0.85rem;
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .auth-btn {
      width: 100%;
      padding: 1rem;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .auth-btn.primary {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
    }

    .auth-btn.primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    .auth-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .loading-spinner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .spinner-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .alert {
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .alert-error {
      background: #fee;
      border: 1px solid #fcc;
      color: #c0392b;
    }

    .alert-icon {
      font-size: 1.2rem;
    }

    .auth-footer {
      text-align: center;
      padding-top: 1.5rem;
      border-top: 1px solid #e9ecef;
    }

    .auth-footer p {
      margin: 0;
      color: #6c757d;
    }

    .auth-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      transition: color 0.3s ease;
    }

    .auth-link:hover {
      color: #764ba2;
      text-decoration: underline;
    }

    .auth-bg {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      position: relative;
      overflow: hidden;
    }

    .bg-pattern {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="60" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="60" cy="30" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>');
      opacity: 0.3;
    }

    .bg-content {
      position: relative;
      z-index: 1;
      color: white;
      text-align: center;
      max-width: 400px;
    }

    .bg-content h2 {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .bg-content p {
      font-size: 1.2rem;
      opacity: 0.9;
      margin: 0;
      line-height: 1.6;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .auth-container {
        flex-direction: column;
      }

      .auth-card {
        margin: 1rem;
        padding: 2rem 1.5rem;
      }

      .auth-bg {
        display: none;
      }

      .bg-content h2 {
        font-size: 2rem;
      }
    }
  `]
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
