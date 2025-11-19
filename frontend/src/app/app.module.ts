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
import { AccessDeniedComponent } from './components/access-denied/access-denied.component';
import { AdminOnlyDirective } from './directives/admin-only.directive';

import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { AdminAccessInterceptor } from './interceptors/admin-access.interceptor';
import { NgChartsModule } from 'ng2-charts';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { APP_INITIALIZER } from '@angular/core';
import { AuthService } from './services/auth.service';

export function appInitializer(authService: AuthService) {
  return () => authService.initializeAuthState();
}

@NgModule({
  declarations: [
    AppComponent,
    OfflineIndicatorComponent,
    NotificationsComponent,
    ProfileComponent,
    SettingsComponent,
    AccessDeniedComponent,
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
    MatSnackBarModule
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
      deps: [AuthService]
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
