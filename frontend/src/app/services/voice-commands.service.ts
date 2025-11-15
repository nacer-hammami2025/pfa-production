import { Injectable } from '@angular/core';
import { TaskService } from './task.service';
import { NotificationService } from './notification.service';
import { BehaviorSubject, Observable } from 'rxjs';

export interface VoiceCommand {
  keywords: string[];
  action: (params: string[]) => Promise<void>;
  description: string;
  example: string;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceCommandsService {
  private recognition: any;
  private commands: VoiceCommand[] = [];
  private isListeningSubject = new BehaviorSubject<boolean>(false);
  public listening$ = this.isListeningSubject.asObservable();

  constructor(
    private taskService: TaskService,
    private notificationService: NotificationService
  ) {
    // Ne pas initialiser automatiquement - sera fait après connexion
  }

  // Méthode pour initialiser les commandes vocales après connexion
  initializeVoiceCommands(): void {
    this.initializeCommands();
    this.initializeSpeechRecognition();
  }

  isSupported(): boolean {
    return 'webkitSpeechRecognition' in window;
  }

  start(): void {
    if (this.isSupported() && !this.isListeningSubject.value) {
      this.recognition.start();
    }
  }

  stop(): void {
    if (this.isSupported() && this.isListeningSubject.value) {
      this.recognition.stop();
    }
  }

  private initializeCommands() {
    this.commands = [
      {
        keywords: ['créer', 'nouvelle', 'ajouter', 'create', 'new', 'add', 'faire', 'commencer'],
        action: async (params: string[]) => {
          const title = params.join(' ');
          console.log('📝 Tentative de création de tâche avec titre:', title);
          if (title.trim()) {
            console.log('🚀 Appel de taskService.createTask...');
            await this.taskService.createTask({
              title: title.trim(),
              description: '',
              priority: 'medium',
              category: 'other'
            }).toPromise();
            console.log('✅ Tâche créée avec succès');
            this.notificationService.addNotification({
              type: 'success',
              title: 'Tâche créée par commande vocale',
              message: `"${title}" a été ajoutée à votre liste de tâches.`
            });
          } else {
            console.log('❌ Titre vide, tâche non créée');
          }
        },
        description: 'Créer une nouvelle tâche',
        example: 'Créer une tâche : appeler le client demain'
      },
      {
        keywords: ['terminer', 'compléter', 'finir', 'complete', 'finish', 'done', 'fini', 'terminé'],
        action: async (params: string[]) => {
          const title = params.join(' ');
          // Pour simplifier, on cherche la première tâche non terminée contenant le titre
          const tasks = await this.taskService.getTasks({ completed: false }).toPromise();
          if (tasks && tasks.length > 0) {
            const task = tasks.find(t =>
              t.title.toLowerCase().includes(title.toLowerCase())
            );
            if (task) {
              await this.taskService.toggleTaskCompleted(task._id).toPromise();
              this.notificationService.addNotification({
                type: 'success',
                title: 'Tâche terminée',
                message: `"${task.title}" a été marquée comme terminée.`
              });
            } else {
              this.notificationService.addNotification({
                type: 'warning',
                title: 'Tâche non trouvée',
                message: `Aucune tâche trouvée contenant "${title}".`
              });
            }
          }
        },
        description: 'Marquer une tâche comme terminée',
        example: 'Terminer la réunion marketing'
      },
      {
        keywords: ['supprimer', 'effacer', 'delete', 'remove', 'enlever', 'retirer'],
        action: async (params: string[]) => {
          const title = params.join(' ');
          const tasks = await this.taskService.getTasks().toPromise();
          if (tasks && tasks.length > 0) {
            const task = tasks.find(t =>
              t.title.toLowerCase().includes(title.toLowerCase())
            );
            if (task) {
              await this.taskService.deleteTask(task._id).toPromise();
              this.notificationService.addNotification({
                type: 'info',
                title: 'Tâche supprimée',
                message: `"${task.title}" a été supprimée.`
              });
            } else {
              this.notificationService.addNotification({
                type: 'warning',
                title: 'Tâche non trouvée',
                message: `Aucune tâche trouvée contenant "${title}".`
              });
            }
          }
        },
        description: 'Supprimer une tâche',
        example: 'Supprimer la tâche obsolète'
      },
      {
        keywords: ['urgent', 'urgence', 'priorité', 'priority', 'important', 'critique'],
        action: async (params: string[]) => {
          const title = params.slice(0, -1).join(' '); // Remove "urgent" from params
          const tasks = await this.taskService.getTasks().toPromise();
          if (tasks && tasks.length > 0) {
            const task = tasks.find(t =>
              t.title.toLowerCase().includes(title.toLowerCase())
            );
            if (task) {
              await this.taskService.updateTask(task._id, { priority: 'urgent' }).toPromise();
              this.notificationService.addNotification({
                type: 'warning',
                title: 'Priorité mise à jour',
                message: `"${task.title}" est maintenant marquée comme urgente.`
              });
            }
          }
        },
        description: 'Marquer une tâche comme urgente',
        example: 'Marquer la réunion comme urgente'
      },
      {
        keywords: ['demain', 'tomorrow', 'lendemain', 'jour prochain'],
        action: async (params: string[]) => {
          const title = params.slice(0, -1).join(' '); // Remove "demain" from params
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);

          await this.taskService.createTask({
            title: title.trim(),
            description: '',
            priority: 'medium',
            category: 'other',
            dueDate: tomorrow.toISOString().split('T')[0]
          }).toPromise();

          this.notificationService.addNotification({
            type: 'success',
            title: 'Tâche planifiée',
            message: `"${title}" est programmée pour demain.`
          });
        },
        description: 'Créer une tâche pour demain',
        example: 'Appeler le client demain'
      }
    ];
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'fr-FR'; // French language

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        this.processCommand(transcript);
      };

      this.recognition.onerror = (event: any) => {
        console.error('Erreur de reconnaissance vocale:', event.error);
        this.notificationService.addNotification({
          type: 'error',
          title: 'Erreur de reconnaissance',
          message: 'Impossible de comprendre la commande vocale.'
        });
      };

      this.recognition.onend = () => {
        this.isListeningSubject.next(false);
      };
    }
  }

  startListening(): boolean {
    if (!this.recognition) {
      this.notificationService.addNotification({
        type: 'error',
        title: 'Navigateur non compatible',
        message: 'Votre navigateur ne supporte pas la reconnaissance vocale.'
      });
      return false;
    }

    if (this.isListeningSubject.value) {
      return false;
    }

    try {
      this.recognition.start();
      this.isListeningSubject.next(true);
      return true;
    } catch (error) {
      console.error('Erreur lors du démarrage de la reconnaissance:', error);
      return false;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListeningSubject.value) {
      this.recognition.stop();
      this.isListeningSubject.next(false);
    }
  }

  isCurrentlyListening(): boolean {
    return this.isListeningSubject.value;
  }

  getListeningStatus(): Observable<boolean> {
    return this.isListeningSubject.asObservable();
  }

  getAvailableCommands(): VoiceCommand[] {
    return this.commands;
  }

  private async processCommand(transcript: string) {
    console.log('🎤 Commande vocale reçue:', transcript);

    // Normalize transcript
    const normalizedTranscript = transcript.toLowerCase().trim();

    // Notify user that command was heard
    this.notificationService.addNotification({
      type: 'info',
      title: 'Commande vocale détectée',
      message: `"${transcript}"`
    });

    console.log('🔍 Transcript normalisé:', normalizedTranscript);

    // Try to match commands with more flexible logic
    for (const command of this.commands) {
      for (const keyword of command.keywords) {
        console.log('🔎 Test du mot-clé:', keyword);
        if (normalizedTranscript.includes(keyword)) {
          console.log('✅ Mot-clé trouvé:', keyword, 'dans:', normalizedTranscript);
          // Extract parameters more intelligently
          const keywordIndex = normalizedTranscript.indexOf(keyword);
          let params = normalizedTranscript.substring(keywordIndex + keyword.length).trim();

          console.log('📝 Paramètres bruts:', params);

          // Remove common filler words
          params = params.replace(/\b(une?|le|la|les|de|du|des|et|à|a|un)\b/g, '').trim();

          console.log('🧹 Paramètres nettoyés:', params);

          // Split by spaces and filter out empty strings
          const paramArray = params.split(' ').filter(p => p.length > 0);

          console.log('📋 Paramètres finaux:', paramArray);

          try {
            await command.action(paramArray);
            console.log('✅ Commande exécutée avec succès');
            return; // Exit after first successful match
          } catch (error) {
            console.error('❌ Erreur lors de l\'exécution de la commande:', error);
            this.notificationService.addNotification({
              type: 'error',
              title: 'Erreur de commande',
              message: 'Impossible d\'exécuter la commande vocale.'
            });
            return;
          }
        }
      }
    }

    // No command matched - provide helpful suggestions
    console.log('❌ Aucune commande reconnue pour:', normalizedTranscript);
    this.notificationService.addNotification({
      type: 'warning',
      title: 'Commande non reconnue',
      message: 'Essayez : "Créer une tâche appeler client" ou "Terminer réunion marketing"'
    });
  }
}