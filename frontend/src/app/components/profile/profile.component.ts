import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  
  // Modals visibility
  showPasswordModal = false;
  showMfaModal = false;
  showEditModal = false;
  
  // Password change
  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  
  // MFA
  mfaEnabled = false;
  mfaQrCode = '';
  mfaSecret = '';
  mfaCode = '';
  
  // Profile edit
  editData = {
    name: '',
    phone: '',
    bio: ''
  };
  
  // Profile photo
  selectedFile: File | null = null;
  photoPreview: string | null = null;

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.editData.name = this.user?.email?.split('@')[0] || '';
    this.checkMfaStatus();
  }
  
  // Photo upload
  onPhotoSelect(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.selectedFile = file;
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.photoPreview = e.target.result;
      };
      reader.readAsDataURL(file);
      
      this.uploadPhoto();
    }
  }
  
  triggerPhotoUpload() {
    document.getElementById('photoInput')?.click();
  }
  
  async uploadPhoto() {
    if (!this.selectedFile) return;
    
    const formData = new FormData();
    formData.append('photo', this.selectedFile);
    
    try {
      const response: any = await this.http.post('/api/users/profile/photo', formData).toPromise();
      alert('Photo mise à jour avec succès !');
      this.user.photoUrl = response.photoUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Erreur lors du téléchargement de la photo');
    }
  }
  
  // Password change
  openPasswordModal() {
    this.showPasswordModal = true;
    this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
  }
  
  closePasswordModal() {
    this.showPasswordModal = false;
  }
  
  async changePassword() {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (this.passwordData.newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    try {
      await this.http.post('/api/users/change-password', {
        currentPassword: this.passwordData.currentPassword,
        newPassword: this.passwordData.newPassword
      }).toPromise();
      
      alert('Mot de passe modifié avec succès !');
      this.closePasswordModal();
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert(error.error?.message || 'Erreur lors du changement de mot de passe');
    }
  }
  
  // MFA
  async checkMfaStatus() {
    try {
      const response: any = await this.http.get('/api/users/mfa/status').toPromise();
      this.mfaEnabled = response.enabled || false;
    } catch (error) {
      console.error('Error checking MFA status:', error);
    }
  }
  
  async openMfaModal() {
    if (this.mfaEnabled) {
      if (confirm('Voulez-vous désactiver l\'authentification à deux facteurs ?')) {
        await this.disableMfa();
      }
      return;
    }
    
    try {
      const response: any = await this.http.post('/api/users/mfa/setup', {}).toPromise();
      this.mfaQrCode = response.qrCode;
      this.mfaSecret = response.secret;
      this.showMfaModal = true;
    } catch (error) {
      console.error('Error setting up MFA:', error);
      alert('Erreur lors de la configuration de l\'authentification à deux facteurs');
    }
  }
  
  closeMfaModal() {
    this.showMfaModal = false;
    this.mfaCode = '';
  }
  
  async enableMfa() {
    if (!this.mfaCode || this.mfaCode.length !== 6) {
      alert('Veuillez entrer un code à 6 chiffres');
      return;
    }
    
    try {
      await this.http.post('/api/users/mfa/verify', {
        token: this.mfaCode,
        secret: this.mfaSecret
      }).toPromise();
      
      this.mfaEnabled = true;
      alert('Authentification à deux facteurs activée avec succès !');
      this.closeMfaModal();
    } catch (error) {
      console.error('Error enabling MFA:', error);
      alert('Code invalide. Veuillez réessayer.');
    }
  }
  
  async disableMfa() {
    try {
      await this.http.post('/api/users/mfa/disable', {}).toPromise();
      this.mfaEnabled = false;
      alert('Authentification à deux facteurs désactivée');
    } catch (error) {
      console.error('Error disabling MFA:', error);
      alert('Erreur lors de la désactivation');
    }
  }
  
  // Profile edit
  openEditModal() {
    this.showEditModal = true;
  }
  
  closeEditModal() {
    this.showEditModal = false;
  }
  
  async saveProfile() {
    try {
      const response: any = await this.http.put('/api/users/profile', this.editData).toPromise();
      
      // Mettre à jour les données locales
      if (response.user) {
        this.user = { ...this.user, ...response.user };
      } else {
        // Mettre à jour manuellement si le serveur ne retourne pas l'user complet
        this.user.name = this.editData.name;
        this.user.phone = this.editData.phone;
        this.user.bio = this.editData.bio;
      }
      
      alert('✅ Profil mis à jour avec succès !');
      this.closeEditModal();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('❌ Erreur lors de la mise à jour du profil');
    }
  }
}
