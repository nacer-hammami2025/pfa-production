import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

import { AccessDeniedComponent } from './components/access-denied/access-denied.component';
import { AdminOnlyDirective } from './directives/admin-only.directive';
import { AdminGuard } from './guards/admin.guard';
import { AdminAccessInterceptor } from './interceptors/admin-access.interceptor';

@NgModule({
  declarations: [
    AccessDeniedComponent,
    AdminOnlyDirective
  ],
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    RouterModule
  ],
  providers: [
    AdminGuard,
    AdminAccessInterceptor
  ],
  exports: [
    AccessDeniedComponent,
    AdminOnlyDirective
  ]
})
export class AdminSecurityModule { }