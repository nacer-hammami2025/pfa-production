import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { OAuthService } from '../services/oauth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  userType = 'user'; // 'user' or 'admin'
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  
  // MFA
  showMfaStep = false;
  mfaToken = '';
  tempUser: any = null;
  currentEmail = ''; // Pour stocker l'email pendant le processus MFA

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private oAuthService: OAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
  }

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

  async login(): Promise<void> {
    if (this.loginForm.invalid) {
      this.errorMessage = 'Veuillez remplir tous les champs correctement';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { email, password } = this.loginForm.value;

    try {
      // Passer le rôle demandé au backend
      const result = await this.authService.login(email, password, this.userType);
      
      if (result.mfaRequired && result.user) {
        // MFA requis
        this.showMfaStep = true;
        this.tempUser = result.user;
        this.currentEmail = email; // Stocker l'email pour MFA
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
      const success = await this.authService.verifyMfaLogin(this.currentEmail, this.mfaToken);
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
    // DEBUG: Log complet de l'erreur
    console.log('🔍 [DEBUG] handleLoginError appelé');
    console.log('🔍 [DEBUG] error.status:', error.status);
    console.log('🔍 [DEBUG] error complet:', JSON.stringify(error, null, 2));
    
    // Gérer les erreurs avec messages du backend
    if (error.status === 403) {
      // SÉCURITÉ: Tentative d'accès avec un rôle inapproprié - rediriger vers access-denied
      console.log('🚨 TENTATIVE D\'ACCÈS NON AUTORISÉ DÉTECTÉE', error);
      console.log('🚨 Redirection vers /access-denied...');
      this.router.navigate(['/access-denied'], { 
        queryParams: { 
          reason: 'role-mismatch',
          attempted: this.userType,
          message: error.error?.errors?.[0]?.msg || 'Accès refusé'
        }
      });
      return;
    } else if (error.error && error.error.errors && error.error.errors.length > 0) {
      // Utiliser le message professionnel du backend
      const backendMessage = error.error.errors[0].msg;
      const backendDetails = error.error.errors[0].details;
      
      console.log('📝 Message backend:', backendMessage);
      console.log('📝 Détails backend:', backendDetails);
      
      // Afficher le message professionnel du backend
      this.errorMessage = backendDetails || backendMessage;
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

  async loginWithGoogle(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      await this.oAuthService.loginWithGoogle();
    } catch (error: any) {
      this.errorMessage = error.message || 'Google connection failed. Please try again.';
      this.isLoading = false;
    }
  }

  async loginWithMicrosoft(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      await this.oAuthService.loginWithMicrosoft();
    } catch (error: any) {
      this.errorMessage = error.message || 'Microsoft connection failed. Please try again.';
      this.isLoading = false;
    }
  }
}
