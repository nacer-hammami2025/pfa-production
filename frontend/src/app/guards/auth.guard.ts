import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    if (this.auth.isAuthenticated()) {
      const userRole = this.auth.getUserRole(); // Fetch the user role from AuthService
      const requiredRole = route.data['role']; // Get the required role from route data

      // If no specific role is required, allow access
      if (!requiredRole) {
        return true;
      }

      // If admin role is required, ONLY admins can access
      if (requiredRole === 'admin') {
        if (userRole === 'admin') {
          return true;
        } else {
          // Regular user trying to access admin route -> forbidden
          console.error('[AuthGuard] User with role', userRole, 'tried to access admin route');
          return this.router.createUrlTree(['/tasks']);
        }
      }

      // If user role is required, allow both users AND admins
      if (requiredRole === 'user') {
        if (userRole === 'user' || userRole === 'admin') {
          return true;
        } else {
          console.error('[AuthGuard] Invalid role:', userRole);
          return this.router.createUrlTree(['/login']);
        }
      }

      // Any other case
      return true;
    }
    // Not authenticated -> redirect to login with return url
    return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
}
