import { Component, OnInit, OnDestroy } from '@angular/core';
import { VoiceCommandsService, VoiceCommand } from '../services/voice-commands.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-voice-commands',
  template: `
    <div class="voice-commands-container">
      <div class="voice-header">
        <div class="voice-title">
          <div class="voice-icon">🎤</div>
          <h3>Commandes Vocales</h3>
        </div>
        <button
          class="voice-toggle-btn"
          [class.listening]="isListening"
          (click)="toggleVoiceCommands()"
          [disabled]="!isSupported"
        >
          <span class="btn-icon">{{ isListening ? '⏹️' : '🎤' }}</span>
          <span class="btn-text">{{ isListening ? 'Arrêter' : 'Commencer' }}</span>
        </button>
      </div>

      <div class="voice-status" *ngIf="!isSupported">
        <div class="status-icon">⚠️</div>
        <p>Votre navigateur ne supporte pas la reconnaissance vocale.</p>
        <small>Essayez Chrome, Edge ou Safari pour une meilleure expérience.</small>
      </div>

      <div class="voice-status listening-indicator" *ngIf="isSupported && isListening">
        <div class="status-icon pulsing">🎤</div>
        <p>Écoute en cours... Parlez maintenant !</p>
        <small>Cliquez sur "Arrêter" pour désactiver.</small>
      </div>

      <div class="commands-section">
        <h4>Commandes Disponibles</h4>
        <div class="commands-grid">
          <div class="command-card" *ngFor="let command of availableCommands">
            <div class="command-header">
              <div class="command-icon">💬</div>
              <div class="command-title">{{ command.description }}</div>
            </div>
            <div class="command-example">
              <strong>Exemple :</strong> {{ command.example }}
            </div>
            <div class="command-keywords">
              <small>Mots-clés : {{ command.keywords.join(', ') }}</small>
            </div>
          </div>
        </div>
      </div>

      <div class="voice-tips">
        <h4>💡 Conseils d'utilisation</h4>
        <ul>
          <li>Parlez naturellement et clairement</li>
          <li>Utilisez les mots-clés listés pour chaque commande</li>
          <li>Assurez-vous d'être dans un environnement calme</li>
          <li>Le raccourci <kbd>Ctrl+M</kbd> active/désactive la reconnaissance</li>
          <li>Le bouton flottant rouge en bas à droite permet un accès rapide</li>
        </ul>
      </div>

      <div class="voice-shortcuts">
        <h4>⌨️ Raccourcis clavier</h4>
        <div class="shortcut-item">
          <kbd>Ctrl+M</kbd>
          <span>Activer/désactiver les commandes vocales</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .voice-commands-container {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      padding: 2rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      max-width: 800px;
      margin: 0 auto;
    }

    :host-context(.dark-mode) .voice-commands-container {
      background: rgba(15, 15, 35, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .voice-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }

    :host-context(.dark-mode) .voice-header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .voice-title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .voice-title h3 {
      margin: 0;
      color: #2c3e50;
      font-size: 1.5rem;
    }

    :host-context(.dark-mode) .voice-title h3 {
      color: #e2e8f0;
    }

    .voice-icon {
      font-size: 2rem;
      animation: bounce 2s infinite;
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }

    .voice-toggle-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 25px;
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .voice-toggle-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    .voice-toggle-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .voice-toggle-btn.listening {
      background: linear-gradient(45deg, #e74c3c, #c0392b);
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% { box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3); }
      50% { box-shadow: 0 4px 25px rgba(231, 76, 60, 0.6); }
      100% { box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3); }
    }

    .voice-status {
      text-align: center;
      padding: 2rem;
      background: rgba(102, 126, 234, 0.1);
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    :host-context(.dark-mode) .voice-status {
      background: rgba(102, 126, 234, 0.2);
    }

    .voice-status.listening-indicator {
      background: rgba(231, 76, 60, 0.1);
      border: 2px solid rgba(231, 76, 60, 0.3);
    }

    :host-context(.dark-mode) .voice-status.listening-indicator {
      background: rgba(231, 76, 60, 0.2);
    }

    .status-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .status-icon.pulsing {
      animation: pulse-icon 1.5s infinite;
    }

    @keyframes pulse-icon {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    .voice-status p {
      margin: 0 0 0.5rem 0;
      font-weight: 600;
      color: #2c3e50;
    }

    :host-context(.dark-mode) .voice-status p {
      color: #e2e8f0;
    }

    .voice-status small {
      color: #6c757d;
      font-size: 0.9rem;
    }

    :host-context(.dark-mode) .voice-status small {
      color: #a0aec0;
    }

    .commands-section {
      margin-bottom: 2rem;
    }

    .commands-section h4 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
      font-size: 1.2rem;
    }

    :host-context(.dark-mode) .commands-section h4 {
      color: #e2e8f0;
    }

    .commands-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }

    .command-card {
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.3s ease;
    }

    :host-context(.dark-mode) .command-card {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .command-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    :host-context(.dark-mode) .command-card:hover {
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    }

    .command-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .command-icon {
      font-size: 1.5rem;
      background: linear-gradient(45deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .command-title {
      font-weight: 600;
      color: #2c3e50;
      margin: 0;
    }

    :host-context(.dark-mode) .command-title {
      color: #e2e8f0;
    }

    .command-example {
      color: #6c757d;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    :host-context(.dark-mode) .command-example {
      color: #a0aec0;
    }

    .command-keywords {
      color: #95a5a6;
      font-size: 0.8rem;
    }

    .voice-tips {
      background: rgba(102, 126, 234, 0.05);
      border-radius: 12px;
      padding: 1.5rem;
      border-left: 4px solid #667eea;
    }

    :host-context(.dark-mode) .voice-tips {
      background: rgba(102, 126, 234, 0.1);
    }

    .voice-tips h4 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    :host-context(.dark-mode) .voice-tips h4 {
      color: #e2e8f0;
    }

    .voice-tips ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .voice-tips li {
      color: #6c757d;
      margin-bottom: 0.5rem;
      line-height: 1.4;
    }

    :host-context(.dark-mode) .voice-tips li {
      color: #a0aec0;
    }

    .voice-tips li:last-child {
      margin-bottom: 0;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .voice-commands-container {
        padding: 1rem;
      }

      .voice-header {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .commands-grid {
        grid-template-columns: 1fr;
      }

      .command-card {
        padding: 1rem;
      }
    }

    /* Voice Shortcuts Styles */
    .voice-shortcuts {
      margin-top: 2rem;
      padding: 1.5rem;
      background: rgba(52, 152, 219, 0.1);
      border-radius: 12px;
      border-left: 4px solid #3498db;
    }

    :host-context(.dark-mode) .voice-shortcuts {
      background: rgba(52, 152, 219, 0.2);
    }

    .voice-shortcuts h4 {
      margin: 0 0 1rem 0;
      color: #3498db;
    }

    :host-context(.dark-mode) .voice-shortcuts h4 {
      color: #6bb9f0;
    }

    .shortcut-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem 0;
    }

    .shortcut-item kbd {
      background: #3498db;
      border: none;
      border-radius: 4px;
      color: white;
      font-weight: bold;
      padding: 4px 8px;
      box-shadow: 0 2px 4px rgba(52, 152, 219, 0.3);
    }

    .shortcut-item span {
      color: #2c3e50;
      font-size: 0.9rem;
    }

    :host-context(.dark-mode) .shortcut-item span {
      color: #e2e8f0;
    }
  `]
})
export class VoiceCommandsComponent implements OnInit, OnDestroy {
  isListening = false;
  isSupported = false;
  availableCommands: VoiceCommand[] = [];
  private subscription?: Subscription;

  constructor(private voiceCommandsService: VoiceCommandsService) {}

  ngOnInit() {
    this.isSupported = this.checkBrowserSupport();
    this.availableCommands = this.voiceCommandsService.getAvailableCommands();

    // Subscribe to listening status changes
    this.subscription = this.voiceCommandsService.getListeningStatus().subscribe(
      isListening => {
        this.isListening = isListening;
      }
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  toggleVoiceCommands() {
    if (this.isListening) {
      this.voiceCommandsService.stopListening();
      this.isListening = false;
    } else {
      const started = this.voiceCommandsService.startListening();
      if (started) {
        this.isListening = true;
      }
    }
  }

  private checkBrowserSupport(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }
}