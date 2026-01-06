import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { PersistentNotificationService } from '../services/persistent-notification.service';
import { TaskService } from '../services/task.service';
import { VoiceCommandsService } from '../services/voice-commands.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'frontend';
  isLoggedIn = false;
  isAdmin = false;
  user: any = null;
  isDarkMode = false;
  showNotifications = false;
  unreadCount = 0;

  isMenuOpen = false;
  showToolsMenu = false;
  showAnalyticsMenu = false;
  showSettingsMenu = false;
  showAdminMenu = false;
  isScrolled = false;

  // Voice Commands
  isVoiceSupported: boolean;
  isVoiceListening = false;
  private voiceSubscription!: Subscription;

  // Getters for template compatibility
  get isAuthenticated(): boolean {
    return this.isLoggedIn;
  }

  get userRole(): string {
    return this.isAdmin ? 'admin' : 'user';
  }

  constructor(
    public authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private persistentNotificationService: PersistentNotificationService,
    private taskService: TaskService, // Inject TaskService
    private voiceCommandsService: VoiceCommandsService
  ) {
    this.isVoiceSupported = this.voiceCommandsService.isSupported();
  }

  ngOnInit() {
    // Subscribe to authentication changes
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      this.isLoggedIn = !!user;
      this.isAdmin = this.authService.isAdmin();
      
      console.log('🔄 Auth state changed:', {
        isLoggedIn: this.isLoggedIn,
        isAdmin: this.isAdmin,
        user: this.user
      });
      
      if (this.isLoggedIn) {
        // Check for overdue tasks on login
        this.checkOverdueTasks();
        // Subscribe to unread notifications count
        this.notificationService.getUnreadCount().subscribe(count => {
          this.unreadCount = count;
        });
        // Load persistent notifications (team requests, etc.)
        console.log('🔔 Chargement des notifications persistantes...');
        try {
          this.persistentNotificationService.displayPersistentNotifications();
        } catch (error) {
          console.error('❌ Erreur lors du chargement des notifications persistantes:', error);
        }
      }
    });

    if (this.isVoiceSupported) {
      this.voiceSubscription = this.voiceCommandsService.listening$.subscribe(
        isListening => (this.isVoiceListening = isListening)
      );
    }
  }

  ngOnDestroy() {
    if (this.voiceSubscription) {
      this.voiceSubscription.unsubscribe();
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 10;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    console.log('🎯 Document click detected, target:', target.className);
    // Empêcher la fermeture si le clic est dans un menu ou sur un bouton de menu
    if (!target.closest('.nav-dropdown') && 
        !target.closest('.dropdown-menu') && 
        !target.closest('.profile-menu') &&
        !target.closest('.profile-btn') &&
        !target.closest('.nav-link')) {
      console.log('🎯 Click outside menu - scheduling close');
      this.scheduleMenuClose();
    } else {
      console.log('🎯 Click inside menu - keeping open');
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.closeAllDropdowns();
  }

  toggleToolsMenu(event?: Event) {
    if (event) event.stopPropagation();
    this.showToolsMenu = !this.showToolsMenu;
    this.showAnalyticsMenu = false;
    this.showSettingsMenu = false;
    this.showAdminMenu = false;
  }

  toggleAnalyticsMenu(event?: Event) {
    if (event) event.stopPropagation();
    this.showAnalyticsMenu = !this.showAnalyticsMenu;
    this.showToolsMenu = false;
    this.showSettingsMenu = false;
    this.showAdminMenu = false;
  }

  toggleSettingsMenu(event?: Event) {
    console.log('🎯 toggleSettingsMenu called', this.showSettingsMenu);
    if (event) event.stopPropagation();
    this.showSettingsMenu = !this.showSettingsMenu;
    this.showToolsMenu = false;
    this.showAnalyticsMenu = false;
    this.showAdminMenu = false;
    console.log('🎯 showSettingsMenu is now:', this.showSettingsMenu);
  }

  toggleAdminMenu(event?: Event) {
    if (event) event.stopPropagation();
    this.showAdminMenu = !this.showAdminMenu;
    this.showToolsMenu = false;
    this.showAnalyticsMenu = false;
    this.showSettingsMenu = false;
  }

  private menuCloseTimeout: any;

  closeAllDropdowns() {
    this.showToolsMenu = false;
    this.showAnalyticsMenu = false;
    this.showSettingsMenu = false;
    this.showAdminMenu = false;
  }

  scheduleMenuClose() {
    // NE PLUS fermer automatiquement - l'utilisateur ferme manuellement ou en cliquant ailleurs
    // Délai très long (30 secondes) pour éviter toute fermeture intempestive
    console.log('⏰ Menu will stay open - no auto-close');
    if (this.menuCloseTimeout) {
      clearTimeout(this.menuCloseTimeout);
    }
    this.menuCloseTimeout = setTimeout(() => {
      console.log('⏰ Menu close timeout triggered after 30s');
      this.closeAllDropdowns();
    }, 30000); // 30 secondes - presque jamais de fermeture auto
  }

  cancelMenuClose() {
    console.log('⏰ Canceling menu close timeout');
    if (this.menuCloseTimeout) {
      clearTimeout(this.menuCloseTimeout);
      this.menuCloseTimeout = null;
    }
  }

  onMenuMouseLeave() {
    // NE PAS fermer le menu quand la souris quitte - trop frustrant
    // L'utilisateur peut cliquer ailleurs pour fermer
    console.log('🖱️ Mouse LEAVE menu - menu stays OPEN (user clicks elsewhere to close)');
    // Pas d'appel à scheduleMenuClose() - le menu reste ouvert
  }

  onMenuMouseEnter() {
    console.log('🖱️ Mouse ENTER menu - canceling close');
    this.cancelMenuClose();
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    // Sauvegarder dans localStorage
    localStorage.setItem('darkMode', this.isDarkMode.toString());
    // Appliquer le thème
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    console.log('✨ Theme toggled:', this.isDarkMode ? 'Dark' : 'Light');
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.closeMenu();
  }

  logout() {
    this.authService.logout();
    this.isLoggedIn = false;
    this.isAdmin = false;
    this.closeAllDropdowns();
    this.router.navigate(['/login']);
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  closeNotifications(event?: Event) {
    this.showNotifications = false;
  }

  checkOverdueTasks() {
    this.taskService.getOverdueTasks().subscribe({
      next: (tasks) => {
        if (tasks.length > 0) {
          this.notificationService.addNotification({
            title: 'Tâches en Retard',
            message: `Vous avez ${tasks.length} tâche(s) en retard.`,
            type: 'warning',
          });
        }
      },
      error: (err) => {
        console.error('Erreur lors de la vérification des tâches en retard:', err);
      },
    });
  }

  // Voice Commands
  toggleVoiceCommands() {
    if (this.isVoiceListening) {
      this.voiceCommandsService.stop();
    } else {
      this.voiceCommandsService.start();
    }
  }

  // Navigation Methods
  goToProfile() {
    this.closeAllDropdowns();
    this.router.navigate(['/profile']);
  }

  goToSettings() {
    this.closeAllDropdowns();
    this.router.navigate(['/settings']);
  }
}
