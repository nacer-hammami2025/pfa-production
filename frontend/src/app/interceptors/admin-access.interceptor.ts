import { Injectable } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class AdminAccessInterceptor implements HttpInterceptor {

  constructor(
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        
        // Vérifier si c'est une erreur d'accès admin
        if (error.status === 403 && 
            error.error?.msg === 'Access denied: admin privileges required') {
          
          // Afficher un message élégant
          this.showAccessDeniedMessage();
          
          // Rediriger vers la page d'accès refusé
          this.router.navigate(['/access-denied']);
          
          return throwError(error);
        }

        return throwError(error);
      })
    );
  }

  private showAccessDeniedMessage() {
    this.snackBar.open(
      '🛡️ Accès administrateur requis pour cette fonctionnalité',
      'Fermer',
      {
        duration: 5000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );
  }
}