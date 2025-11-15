import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';

import { AdminRoutingModule } from './admin-routing.module';
import { UserManagementComponent } from './user-management.component';
import { TeamManagementComponent } from './team-management.component';
import { AdminDashboardHomeComponent } from './admin-dashboard-home.component';

@NgModule({
  declarations: [
    UserManagementComponent,
    TeamManagementComponent,
    AdminDashboardHomeComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AdminRoutingModule,
    NgChartsModule
  ]
})
export class AdminModule { }
