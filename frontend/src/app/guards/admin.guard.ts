import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    const user = this.authService.getCurrentUser();
    
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    // Vérifier si l'utilisateur a le rôle admin
    if (user.role === 'admin') {
      return true;
    }

    // Rediriger vers la page d'accès refusé avec un message professionnel
    this.router.navigate(['/access-denied']);
    return false;
  }
}