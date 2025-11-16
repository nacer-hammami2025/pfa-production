import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  userType = 'user'; // 'user' or 'admin'
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  
  // MFA
  showMfaStep = false;
  mfaToken = '';
  tempUser: any = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    // Vérifier si l'utilisateur est déjà connecté
    if (this.authService.isAuthenticated()) {
      const role = this.authService.getUserRole();
      if (role === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/tasks']);
      }
    }
    
    // Get return URL from route parameters or default to appropriate dashboard
    this.route.queryParams.subscribe(params => {
      if (params['returnUrl']) {
        // Store return URL for after login
        sessionStorage.setItem('returnUrl', params['returnUrl']);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  setUserType(type: string): void {
    this.userType = type;
  }

  async submit(): Promise<void> {
    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      // Passer le rôle demandé au backend
      const result = await this.authService.login(this.email, this.password, this.userType);
      
      if (result.mfaRequired && result.user) {
        // MFA requis
        this.showMfaStep = true;
        this.tempUser = result.user;
        this.isLoading = false;
        return;
      }

      if (result.success) {
        this.isLoading = false;
        this.redirectAfterLogin();
      } else {
        this.isLoading = false;
        this.errorMessage = 'Échec de la connexion';
      }
    } catch (error: any) {
      this.isLoading = false;
      this.handleLoginError(error);
    }
  }

  async submitMfa(): Promise<void> {
    if (!this.mfaToken) {
      this.errorMessage = 'Veuillez entrer le code MFA';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const success = await this.authService.verifyMfaLogin(this.email, this.mfaToken);
      if (success) {
        this.isLoading = false;
        this.redirectAfterLogin();
      } else {
        this.isLoading = false;
        this.errorMessage = 'Code MFA invalide';
      }
    } catch (error: any) {
      this.isLoading = false;
      this.errorMessage = 'Code MFA invalide ou expiré';
      console.error('Erreur MFA:', error);
    }
  }

  private redirectAfterLogin(): void {
    // Check if there's a return URL
    const returnUrl = sessionStorage.getItem('returnUrl');
    if (returnUrl) {
      sessionStorage.removeItem('returnUrl');
      this.router.navigateByUrl(returnUrl);
    } else {
      // Get the actual user role from AuthService after login
      const userRole = this.authService.getUserRole();
      
      // Redirection basée sur le rôle réel de l'utilisateur
      if (userRole === 'admin') {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/tasks']);
      }
    }
  }

  private handleLoginError(error: any): void {
    // Gérer les erreurs avec messages du backend
    if (error.error && error.error.errors && error.error.errors.length > 0) {
      this.errorMessage = error.error.errors[0].msg;
    } else if (error.status === 403) {
      this.errorMessage = 'Accès refusé. Vérifiez vos identifiants et le type de compte.';
    } else if (error.status === 401 || error.status === 400) {
      this.errorMessage = 'Email ou mot de passe incorrect';
    } else if (error.status === 0) {
      this.errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
    } else {
      this.errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
    }
    console.error('Erreur de connexion:', error);
  }

  backToLogin(): void {
    this.showMfaStep = false;
    this.mfaToken = '';
    this.tempUser = null;
    this.errorMessage = '';
  }
}
