import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface JwtPayload {
  sub?: string;
  exp?: number;
  iat?: number;
  name?: string;
  email?: string;
  [key: string]: any;
}

export interface AuthResponse {
  token: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = '/api'; // Use relative path for proxy
  private readonly tokenKey = 'pfa_token';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoggedIn$ = this.currentUser$.pipe(map(user => !!user));

  constructor(private http: HttpClient) {
    // L'initialisation est maintenant gérée par APP_INITIALIZER
  }

  // Méthode pour initialiser l'état d'authentification de manière asynchrone
  public initializeAuthState(): Promise<void> {
    return new Promise((resolve) => {
      const token = this.getToken();
      if (token) {
        const payload = this.decodePayload(token);
        if (payload && this.isTokenValid(payload)) {
          // Extract role from payload
          const role = payload['user']?.['role'] || payload['role'];
          const userWithRole = { ...payload, role };
          this.currentUserSubject.next(userWithRole);
        } else {
          this.logout(); // Token invalide ou expiré
        }
      }
      resolve();
    });
  }

  async register(name: string, email: string, password: string): Promise<boolean> {
    try {
      const res = await this.http.post<AuthResponse>(
        `${this.base}/auth/register`,
        { name, email, password }
      ).toPromise();

      return this.handleAuthResponse(res);
    } catch (err) {
      console.error('Registration error:', err);
      throw this.handleError(err);
    }
  }

  async login(email: string, password: string, requestedRole: string = 'user'): Promise<boolean> {
    try {
      const res = await this.http.post<AuthResponse>(
        `${this.base}/auth/login`,
        { email, password, requestedRole }
      ).toPromise();

      return this.handleAuthResponse(res);
    } catch (err) {
      console.error('Login error:', err);
      throw this.handleError(err);
    }
  }

  private handleAuthResponse(res: AuthResponse | undefined): boolean {
    if (res && res.token) {
      console.log('✅ Login successful, token received:', res.token.substring(0, 20) + '...');
      localStorage.setItem(this.tokenKey, res.token);
      const payload = this.decodePayload(res.token);
      console.log('📋 Decoded payload:', payload);
      if (payload) {
        // Extract role from payload (could be payload.role or payload.user.role)
        const role = payload['user']?.['role'] || payload['role'];
        const userWithRole = { ...payload, role };
        console.log('👤 User with role:', userWithRole);
        this.currentUserSubject.next(userWithRole);
      }
      return true;
    }
    console.log('❌ No token in response');
    return false;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  isAdmin(): boolean {
    // Check current user subject first
    const currentRole = this.currentUserSubject.value?.role;
    if (currentRole) {
      return currentRole === 'admin';
    }
    
    // Fallback to token check
    const token = this.getToken();
    if (token) {
      const payload = this.decodePayload(token);
      const role = payload?.['user']?.['role'] || payload?.['role'];
      return role === 'admin';
    }
    
    return false;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const payload = this.decodePayload(token);
    return payload ? this.isTokenValid(payload) : false;
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  async forgotPassword(email: string): Promise<string> {
    try {
      const res = await this.http.post<{ message: string; resetToken?: string }>(
        `${this.base}/auth/forgot-password`,
        { email }
      ).toPromise();

      return res?.message || 'Password reset request sent';
    } catch (err) {
      console.error('Forgot password error:', err);
      throw this.handleError(err);
    }
  }

  async resetPassword(token: string, password: string): Promise<string> {
    try {
      const res = await this.http.post<{ message: string }>(
        `${this.base}/auth/reset-password`,
        { token, password }
      ).toPromise();

      return res?.message || 'Password reset successfully';
    } catch (err) {
      console.error('Reset password error:', err);
      throw this.handleError(err);
    }
  }

  private isTokenValid(payload: JwtPayload): boolean {
    if (!payload.exp) return false;
    const now = Date.now() / 1000;
    return payload.exp > now;
  }

  private decodePayload(token: string): JwtPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = parts[1];
      const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      
      return JSON.parse(json);
    } catch (err) {
      console.error('Token decode error:', err);
      return null;
    }
  }

  private handleError(error: any): Error {
    let errorMessage = 'Une erreur inattendue est survenue';
    if (error instanceof HttpErrorResponse) {
      // Check if there's an error array (validation errors)
      if (error.error?.errors && Array.isArray(error.error.errors)) {
        errorMessage = error.error.errors.map((e: any) => e.msg).join(', ');
      } else {
        errorMessage = error.error?.message || error.message || 'Une erreur serveur est survenue';
      }
    }
    return new Error(errorMessage);
  }

  getUserRole(): string {
    const token = this.getToken();
    if (token) {
      const payload = this.decodePayload(token);
      const role = payload?.['user']?.['role'] || payload?.['role'];
      if (role === 'admin' || role === 'user') {
        return role;
      }
    }
    return 'user'; // Default to 'user' if no valid role is found
  }
}
