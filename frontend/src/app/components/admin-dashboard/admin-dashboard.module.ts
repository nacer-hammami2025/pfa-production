import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';

import { AdminDashboardHomeComponent } from './admin-dashboard-home/admin-dashboard-home.component';
import { AdminUserManagementComponent } from './admin-user-management.component';
import { AdminTeamManagementComponent } from './admin-team-management.component';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminDashboardRoutingModule } from './admin-dashboard-routing.module';

@NgModule({
  declarations: [
    AdminDashboardHomeComponent,
    AdminUserManagementComponent,
    AdminTeamManagementComponent,
    AdminDashboardComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    AdminDashboardRoutingModule,
    NgChartsModule
  ]
})
export class AdminDashboardModule { }
