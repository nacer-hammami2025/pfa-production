import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminDashboardHomeComponent } from './admin-dashboard-home/admin-dashboard-home.component';
import { AdminUserManagementComponent } from './admin-user-management.component';
import { AdminTeamManagementComponent } from './admin-team-management.component';
import { TeamRequestsComponent } from './team-requests/team-requests.component';

const routes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent,
    children: [
      { path: '', component: AdminDashboardHomeComponent },
      { path: 'users', component: AdminUserManagementComponent },
      { path: 'teams', component: AdminTeamManagementComponent },
      { path: 'team-requests', component: TeamRequestsComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminDashboardRoutingModule { }
