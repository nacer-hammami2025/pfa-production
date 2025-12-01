import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

declare global {
  interface Window {
    google: any;
    Microsoft: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class OAuthService {
  private readonly baseUrl = environment.apiUrl;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  /**
   * Initialise Google OAuth
   */
  async initializeGoogleOAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window.google !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google OAuth script'));
      document.head.appendChild(script);
    });
  }

  /**
   * Connexion avec Google
   */
  async loginWithGoogle(): Promise<void> {
    try {
      await this.initializeGoogleOAuth();
      
      // Configuration Google OAuth
      window.google.accounts.id.initialize({
        client_id: environment.googleClientId || 'YOUR_GOOGLE_CLIENT_ID',
        callback: this.handleGoogleResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true
      });

      // Afficher le popup de connexion
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback: utiliser le bouton de connexion
          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-button'),
            {
              theme: 'outline',
              size: 'large',
              width: '100%'
            }
          );
        }
      });
    } catch (error) {
      console.error('Google OAuth initialization failed:', error);
      throw new Error('Google connection failed. Please try again.');
    }
  }

  /**
   * Inscription avec Google
   */
  async registerWithGoogle(): Promise<void> {
    // Utilise la même méthode que la connexion
    // Le backend déterminera s'il faut créer un nouveau compte
    await this.loginWithGoogle();
  }

  /**
   * Gère la réponse de Google OAuth
   */
  private async handleGoogleResponse(response: any): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: response.credential
        })
      });

      if (!res.ok) {
        throw new Error('Google authentication failed');
      }

      const data = await res.json();
      
      if (data.token) {
        // Stocker le token et rediriger
        localStorage.setItem('pfa_token', data.token);
        this.authService.setCurrentUser(data.user);
        
        // Rediriger selon le rôle
        if (data.user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/tasks']);
        }
      }
    } catch (error) {
      console.error('Google authentication error:', error);
      throw new Error('Google authentication failed. Please try again.');
    }
  }

  /**
   * Connexion avec Microsoft
   */
  async loginWithMicrosoft(): Promise<void> {
    try {
      // Configuration Microsoft OAuth
      const msalConfig = {
        auth: {
          clientId: environment.microsoftClientId || 'YOUR_MICROSOFT_CLIENT_ID',
          authority: 'https://login.microsoftonline.com/common',
          redirectUri: window.location.origin + '/auth/microsoft/callback'
        }
      };

      // Redirection vers Microsoft OAuth
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${msalConfig.auth.clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(msalConfig.auth.redirectUri)}&` +
        `scope=openid profile email&` +
        `response_mode=query&` +
        `state=login`;

      window.location.href = authUrl;
    } catch (error) {
      console.error('Microsoft OAuth failed:', error);
      throw new Error('Microsoft connection failed. Please try again.');
    }
  }

  /**
   * Inscription avec Microsoft
   */
  async registerWithMicrosoft(): Promise<void> {
    try {
      const msalConfig = {
        auth: {
          clientId: environment.microsoftClientId || 'YOUR_MICROSOFT_CLIENT_ID',
          authority: 'https://login.microsoftonline.com/common',
          redirectUri: window.location.origin + '/auth/microsoft/callback'
        }
      };

      // Redirection vers Microsoft OAuth avec état "register"
      const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${msalConfig.auth.clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(msalConfig.auth.redirectUri)}&` +
        `scope=openid profile email&` +
        `response_mode=query&` +
        `state=register`;

      window.location.href = authUrl;
    } catch (error) {
      console.error('Microsoft OAuth failed:', error);
      throw new Error('Microsoft registration failed. Please try again.');
    }
  }

  /**
   * Gère le callback Microsoft OAuth
   */
  async handleMicrosoftCallback(code: string, state: string): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/microsoft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          state: state,
          redirectUri: window.location.origin + '/auth/microsoft/callback'
        })
      });

      if (!res.ok) {
        throw new Error('Microsoft authentication failed');
      }

      const data = await res.json();
      
      if (data.token) {
        // Stocker le token et rediriger
        localStorage.setItem('pfa_token', data.token);
        this.authService.setCurrentUser(data.user);
        
        // Rediriger selon le rôle
        if (data.user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/tasks']);
        }
      }
    } catch (error) {
      console.error('Microsoft authentication error:', error);
      throw new Error('Microsoft authentication failed. Please try again.');
    }
  }
}