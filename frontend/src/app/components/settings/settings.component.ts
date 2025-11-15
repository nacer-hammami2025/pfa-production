import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  settings = {
    notifications: true,
    emailNotifications: true,
    darkMode: false,
    language: 'fr',
    autoSave: true
  };

  saveSettings() {
    console.log('Settings saved:', this.settings);
    alert('Paramètres enregistrés avec succès !');
  }
}
