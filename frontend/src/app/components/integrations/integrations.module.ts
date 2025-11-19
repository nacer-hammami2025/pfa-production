import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IntegrationsComponent } from './integrations.component';

const routes: Routes = [
  {
    path: '',
    component: IntegrationsComponent
  },
  {
    path: 'google-calendar/callback',
    component: IntegrationsComponent
  },
  {
    path: 'outlook/callback',
    component: IntegrationsComponent
  },
  {
    path: 'slack/callback',
    component: IntegrationsComponent
  },
  {
    path: 'trello/callback',
    component: IntegrationsComponent
  }
];

@NgModule({
  declarations: [IntegrationsComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class IntegrationsModule { }
