import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AccessDeniedComponent } from './components/access-denied.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SettingsComponent } from './components/settings/settings.component';
import { LoginComponent } from './components/login.component';
import { RegisterComponent } from './components/register.component';
import { OAuthCallbackComponent } from './components/oauth-callback.component';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    data: { preload: true }
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'auth/microsoft/callback',
    component: OAuthCallbackComponent
  },
  {
    path: 'forgot-password',
    loadChildren: () => import('./components/forgot-password.module').then(m => m.ForgotPasswordModule)
  },
  {
    path: 'tasks',
    loadChildren: () => import('./components/tasks.module').then(m => m.TasksModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'kanban',
    loadChildren: () => import('./components/kanban/kanban.module').then(m => m.KanbanModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'projects',
    loadChildren: () => import('./components/projects/projects.module').then(m => m.ProjectsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'analytics',
    loadChildren: () => import('./components/analytics.module').then(m => m.AnalyticsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'analytics-dashboard',
    loadChildren: () => import('./components/analytics-dashboard/analytics-dashboard.module').then(m => m.AnalyticsDashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'gamification',
    loadChildren: () => import('./components/gamification.module').then(m => m.GamificationModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'pomodoro',
    loadChildren: () => import('./components/pomodoro.module').then(m => m.PomodoroModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'teams',
    loadChildren: () => import('./components/team-collaboration.module').then(m => m.TeamCollaborationModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadChildren: () => import('./components/admin-dashboard/admin-dashboard.module').then(m => m.AdminDashboardModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'access-denied',
    component: AccessDeniedComponent
  },
  {
    path: 'voice-commands',
    loadChildren: () => import('./components/voice-commands.module').then(m => m.VoiceCommandsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'scheduling',
    loadChildren: () => import('./components/smart-scheduling/smart-scheduling.module').then(m => m.SmartSchedulingModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'time-tracking',
    loadChildren: () => import('./components/time-tracking/time-tracking.module').then(m => m.TimeTrackingModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'ai-suggestions',
    loadChildren: () => import('./components/ai-suggestions/ai-suggestions.module').then(m => m.AiSuggestionsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'integrations',
    loadChildren: () => import('./components/integrations/integrations.module').then(m => m.IntegrationsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    component: SettingsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    enableTracing: false,
    preloadingStrategy: PreloadAllModules,
    onSameUrlNavigation: 'ignore',
    scrollPositionRestoration: 'top'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }