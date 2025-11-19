import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  settings = {
    notifications: true,
    emailNotifications: true,
    darkMode: false,
    language: 'fr',
    autoSave: true
  };

  isLoading = false;

  constructor(
    private http: HttpClient,
    private themeService: ThemeService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadUserPreferences();
  }

  loadUserPreferences() {
    this.isLoading = true;
    this.http.get('/api/users/profile').subscribe({
      next: (response: any) => {
        const user = response.user;
        if (user.preferences) {
          this.settings.notifications = user.preferences.notifications?.push || true;
          this.settings.emailNotifications = user.preferences.notifications?.email || true;
          this.settings.darkMode = user.preferences.theme === 'dark';
          this.settings.language = user.preferences.language || 'fr';
          this.settings.autoSave = user.preferences.autoSave !== false; // default true

          // Apply theme
          this.themeService.setTheme(user.preferences.theme || 'light');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading preferences:', error);
        this.isLoading = false;
      }
    });
  }

  onThemeChange() {
    const theme = this.settings.darkMode ? 'dark' : 'light';
    this.themeService.setTheme(theme);
  }

  saveSettings() {
    this.isLoading = true;

    const preferences = {
      preferences: {
        theme: this.settings.darkMode ? 'dark' : 'light',
        language: this.settings.language,
        autoSave: this.settings.autoSave,
        notifications: {
          push: this.settings.notifications,
          email: this.settings.emailNotifications
        }
      }
    };

    this.http.put('/api/users/profile', preferences).subscribe({
      next: (response: any) => {
        console.log('Settings saved:', response);
        alert('Paramètres enregistrés avec succès !');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error saving settings:', error);
        alert('Erreur lors de la sauvegarde des paramètres');
        this.isLoading = false;
      }
    });
  }
}
