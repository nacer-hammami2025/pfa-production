import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardHomeComponent } from './admin-dashboard-home.component';
import { UserManagementComponent } from './user-management.component';
import { TeamManagementComponent } from './team-management.component';

const routes: Routes = [
  {
    path: '',
    component: AdminDashboardHomeComponent,
    children: [
      { path: 'users', component: UserManagementComponent },
      { path: 'teams', component: TeamManagementComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
