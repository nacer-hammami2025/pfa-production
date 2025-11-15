import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  template: `
    <div class="forgot-password-wrapper">
      <!-- Animated Background -->
      <div class="animated-bg">
        <div class="floating-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
        </div>
        <div class="gradient-overlay"></div>
      </div>

      <!-- Main Container -->
      <div class="forgot-password-container">
        <div class="forgot-password-card glass-card animate-slide-up">
          <!-- Step 1: Request Reset -->
          <div *ngIf="!resetToken" class="step-container">
            <div class="card-header">
              <h2 class="card-title">Forgot Password</h2>
              <p class="card-subtitle">Enter your email address and we'll send you a link to reset your password</p>
            </div>

            <form (ngSubmit)="requestReset()" #requestForm="ngForm" class="reset-form">
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <div class="input-container">
                  <i class="input-icon">✉️</i>
                  <input
                    type="email"
                    [(ngModel)]="email"
                    name="email"
                    required
                    #emailInput="ngModel"
                    class="form-input"
                    placeholder="Enter your email"
                    [class.error]="emailInput.invalid && (emailInput.dirty || emailInput.touched)"
                  />
                  <div class="input-focus-effect"></div>
                </div>
                <div *ngIf="emailInput.invalid && (emailInput.dirty || emailInput.touched)" class="error-message">
                  <i class="error-icon">⚠️</i>
                  Please enter a valid email address
                </div>
              </div>

              <button
                type="submit"
                class="reset-btn"
                [disabled]="requestForm.invalid || isLoading"
                [class.loading]="isLoading"
              >
                <span class="btn-text">{{ isLoading ? 'Sending...' : 'Send Reset Link' }}</span>
                <div class="btn-loader"></div>
              </button>
            </form>
          </div>

          <!-- Step 2: Reset Password -->
          <div *ngIf="resetToken" class="step-container">
            <div class="card-header">
              <h2 class="card-title">Reset Password</h2>
              <p class="card-subtitle">Enter your new password</p>
            </div>

            <form (ngSubmit)="resetPassword()" #resetForm="ngForm" class="reset-form">
              <div class="form-group">
                <label class="form-label">New Password</label>
                <div class="input-container">
                  <i class="input-icon">🔒</i>
                  <input
                    type="password"
                    [(ngModel)]="newPassword"
                    name="newPassword"
                    required
                    minlength="6"
                    #passwordInput="ngModel"
                    class="form-input"
                    placeholder="Enter new password"
                    [class.error]="passwordInput.invalid && (passwordInput.dirty || passwordInput.touched)"
                  />
                  <div class="input-focus-effect"></div>
                </div>
                <div *ngIf="passwordInput.invalid && (passwordInput.dirty || passwordInput.touched)" class="error-message">
                  <i class="error-icon">⚠️</i>
                  Password must be at least 6 characters
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Confirm Password</label>
                <div class="input-container">
                  <i class="input-icon">🔒</i>
                  <input
                    type="password"
                    [(ngModel)]="confirmPassword"
                    name="confirmPassword"
                    required
                    #confirmInput="ngModel"
                    class="form-input"
                    placeholder="Confirm new password"
                    [class.error]="confirmInput.invalid && (confirmInput.dirty || confirmInput.touched) || passwordsDontMatch()"
                  />
                  <div class="input-focus-effect"></div>
                </div>
                <div *ngIf="confirmInput.invalid && (confirmInput.dirty || confirmInput.touched)" class="error-message">
                  <i class="error-icon">⚠️</i>
                  Please confirm your password
                </div>
                <div *ngIf="passwordsDontMatch() && confirmInput.valid" class="error-message">
                  <i class="error-icon">⚠️</i>
                  Passwords don't match
                </div>
              </div>

              <button
                type="submit"
                class="reset-btn"
                [disabled]="resetForm.invalid || isLoading || passwordsDontMatch()"
                [class.loading]="isLoading"
              >
                <span class="btn-text">{{ isLoading ? 'Resetting...' : 'Reset Password' }}</span>
                <div class="btn-loader"></div>
              </button>
            </form>
          </div>

          <!-- Success/Error Messages -->
          <div *ngIf="message" class="alert alert-success animate-fade-in">
            <i class="alert-icon">✅</i>
            {{ message }}
          </div>

          <div *ngIf="error" class="alert alert-error animate-shake">
            <i class="alert-icon">⚠️</i>
            {{ error }}
          </div>

          <!-- Navigation Links -->
          <div class="card-footer">
            <a routerLink="/login" class="back-link">
              <i class="back-icon">←</i>
              Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .forgot-password-wrapper {
      min-height: 100vh;
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    /* Animated Background */
    .animated-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 1;
    }

    .floating-shapes {
      position: absolute;
      width: 100%;
      height: 100%;
    }

    .shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      animation: float 15s infinite linear;
    }

    .shape-1 {
      width: 100px;
      height: 100px;
      top: 20%;
      left: 20%;
      animation-delay: 0s;
    }

    .shape-2 {
      width: 80px;
      height: 80px;
      top: 60%;
      right: 15%;
      animation-delay: -7s;
    }

    .shape-3 {
      width: 120px;
      height: 120px;
      bottom: 20%;
      left: 60%;
      animation-delay: -14s;
    }

    @keyframes float {
      0% { transform: translateY(0px) rotate(0deg); }
      33% { transform: translateY(-20px) rotate(120deg); }
      66% { transform: translateY(15px) rotate(240deg); }
      100% { transform: translateY(0px) rotate(360deg); }
    }

    .gradient-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(45deg,
        rgba(102, 126, 234, 0.2) 0%,
        rgba(118, 75, 162, 0.2) 50%,
        rgba(102, 126, 234, 0.2) 100%);
      animation: gradientShift 20s ease infinite;
    }

    @keyframes gradientShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    /* Main Container */
    .forgot-password-container {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 500px;
    }

    .forgot-password-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 25px;
      padding: 3rem;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .card-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .card-title {
      font-size: 2.2rem;
      font-weight: 700;
      color: #2c3e50;
      margin: 0 0 0.5rem 0;
      background: linear-gradient(45deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .card-subtitle {
      color: #6c757d;
      margin: 0;
      font-size: 1rem;
      line-height: 1.5;
    }

    /* Form Styles */
    .reset-form {
      margin-bottom: 2rem;
    }

    .form-group {
      margin-bottom: 1.8rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.8rem;
      color: #2c3e50;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .input-container {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 1.2rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.2rem;
      color: #adb5bd;
      z-index: 2;
    }

    .form-input {
      width: 100%;
      padding: 1.2rem 1.2rem 1.2rem 3.5rem;
      border: 2px solid #e9ecef;
      border-radius: 15px;
      font-size: 1rem;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      position: relative;
      z-index: 1;
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
      transform: translateY(-2px);
    }

    .form-input.error {
      border-color: #e74c3c;
      animation: shake 0.5s ease-in-out;
    }

    .input-focus-effect {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, #667eea, #764ba2);
      transition: width 0.3s ease;
      border-radius: 1px;
    }

    .form-input:focus + .input-focus-effect {
      width: 100%;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }

    .error-message {
      color: #e74c3c;
      font-size: 0.85rem;
      margin-top: 0.8rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      animation: slideDown 0.3s ease;
    }

    .error-icon {
      font-size: 1rem;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Reset Button */
    .reset-btn {
      width: 100%;
      padding: 1.2rem;
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 15px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      margin-bottom: 1.5rem;
    }

    .reset-btn:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
    }

    .reset-btn:active:not(:disabled) {
      transform: translateY(-1px);
    }

    .reset-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .reset-btn.loading {
      pointer-events: none;
    }

    .btn-text {
      position: relative;
      z-index: 2;
    }

    .btn-loader {
      position: absolute;
      top: 50%;
      right: 1.5rem;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      transform: translateY(-50%);
    }

    @keyframes spin {
      0% { transform: translateY(-50%) rotate(0deg); }
      100% { transform: translateY(-50%) rotate(360deg); }
    }

    /* Alert Styles */
    .alert {
      padding: 1rem 1.5rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      font-weight: 500;
    }

    .alert-success {
      background: linear-gradient(45deg, #d4edda, #c3e6cb);
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .alert-error {
      background: linear-gradient(45deg, #fee, #fdd);
      color: #c53030;
      border: 1px solid #feb2b2;
    }

    .alert-icon {
      font-size: 1.2rem;
    }

    /* Footer */
    .card-footer {
      text-align: center;
    }

    .back-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .back-link:hover {
      color: #764ba2;
      text-decoration: underline;
    }

    .back-icon {
      font-size: 1.1rem;
    }

    /* Animations */
    .animate-fade-in {
      animation: fadeIn 1.5s ease-out;
    }

    .animate-slide-up {
      animation: slideUp 0.8s ease-out;
    }

    .animate-shake {
      animation: shake 0.5s ease-in-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(50px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .forgot-password-wrapper {
        padding: 1rem;
      }

      .forgot-password-card {
        padding: 2rem;
        margin: 0;
      }

      .card-title {
        font-size: 1.8rem;
      }

      .form-input {
        padding: 1rem 1rem 1rem 3rem;
      }

      .reset-btn {
        padding: 1rem;
        font-size: 1rem;
      }
    }

    @media (max-width: 480px) {
      .forgot-password-card {
        padding: 1.5rem;
      }

      .card-title {
        font-size: 1.6rem;
      }
    }
  `]
})
export class ForgotPasswordComponent {
  email = '';
  newPassword = '';
  confirmPassword = '';
  resetToken = '';
  isLoading = false;
  message = '';
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Check if there's a token in the URL (for direct links)
    this.route.queryParams.subscribe(params => {
      if (params['token']) {
        this.resetToken = params['token'];
      }
    });
  }

  async requestReset() {
    if (!this.email) return;

    this.isLoading = true;
    this.message = '';
    this.error = '';

    try {
      const response = await this.authService.forgotPassword(this.email);
      this.message = response;

      // For demo purposes, if we get a reset token back, use it
      // In production, this would come via email link
      setTimeout(() => {
        this.message = 'Check your email for the reset link. For demo purposes, you can also use the token shown in the console.';
      }, 2000);

    } catch (error: any) {
      this.error = error.message || 'Failed to send reset email';
    } finally {
      this.isLoading = false;
    }
  }

  async resetPassword() {
    if (!this.newPassword || !this.confirmPassword || this.passwordsDontMatch()) return;

    this.isLoading = true;
    this.message = '';
    this.error = '';

    try {
      const response = await this.authService.resetPassword(this.resetToken, this.newPassword);
      this.message = response;

      // Redirect to login after successful reset
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);

    } catch (error: any) {
      this.error = error.message || 'Failed to reset password';
    } finally {
      this.isLoading = false;
    }
  }

  passwordsDontMatch(): boolean {
    return !!(this.newPassword && this.confirmPassword && this.newPassword !== this.confirmPassword);
  }
}