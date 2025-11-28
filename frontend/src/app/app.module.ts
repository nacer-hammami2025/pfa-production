import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './components/app.component';
import { OfflineIndicatorComponent } from './components/offline-indicator/offline-indicator.component';
import { NotificationsComponent } from './components/notifications.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SettingsComponent } from './components/settings/settings.component';
import { AccessDeniedComponent } from './components/access-denied.component';
import { RegisterComponent } from './components/register.component';
import { LoginComponent } from './components/login.component';
import { AdminOnlyDirective } from './directives/admin-only.directive';

import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { AdminAccessInterceptor } from './interceptors/admin-access.interceptor';
import { NgChartsModule } from 'ng2-charts';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { APP_INITIALIZER } from '@angular/core';
import { AuthService } from './services/auth.service';
import { PersistentNotificationService } from './services/persistent-notification.service';

export function appInitializer(authService: AuthService, persistentNotificationService: PersistentNotificationService) {
  return async () => {
    await authService.initializeAuthState();
    // Load persistent notifications after auth is initialized
    persistentNotificationService.displayPersistentNotifications();
  };
}

@NgModule({
  declarations: [
    AppComponent,
    OfflineIndicatorComponent,
    NotificationsComponent,
    ProfileComponent,
    SettingsComponent,
    AccessDeniedComponent,
    RegisterComponent,
    LoginComponent,
    AdminOnlyDirective
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    RouterModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    NgChartsModule,
    MatSnackBarModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  providers: [
    AuthGuard,
    AdminGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AdminAccessInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializer,
      multi: true,
      deps: [AuthService, PersistentNotificationService]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
