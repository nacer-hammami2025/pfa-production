import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();
    console.log('🔑 AuthInterceptor - Token:', token ? 'Present' : 'Missing');
    console.log('📡 Request URL:', req.url);

    if (!token) {
      console.log('⚠️ No token found, proceeding without auth header');
      return next.handle(req);
    }

    const authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    console.log('✅ Auth header added to request');
    return next.handle(authReq);
  }
}
