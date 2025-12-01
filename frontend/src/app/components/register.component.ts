import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { OAuthService } from '../services/oauth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private oAuthService: OAuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {}

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else {
      if (confirmPassword && confirmPassword.errors) {
        delete confirmPassword.errors['passwordMismatch'];
        if (Object.keys(confirmPassword.errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }
    return null;
  }

  async register() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const { firstName, lastName, email, password } = this.registerForm.value;
      const fullName = `${firstName} ${lastName}`;
      
      try {
        const success = await this.authService.register(fullName, email, password);
        if (success) {
          this.router.navigate(['/login'], { 
            queryParams: { message: 'Compte créé avec succès! Veuillez vous connecter.' }
          });
        }
      } catch (error: any) {
        this.errorMessage = error?.message || 'Une erreur est survenue lors de la création du compte.';
        this.isLoading = false;
      }
    }
  }

  async registerWithGoogle(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      await this.oAuthService.registerWithGoogle();
    } catch (error: any) {
      this.errorMessage = error.message || 'Google registration failed. Please try again.';
      this.isLoading = false;
    }
  }

  async registerWithMicrosoft(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      await this.oAuthService.registerWithMicrosoft();
    } catch (error: any) {
      this.errorMessage = error.message || 'Microsoft registration failed. Please try again.';
      this.isLoading = false;
    }
  }
}
