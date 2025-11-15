import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { TeamCollaborationComponent } from './team-collaboration/team-collaboration.component';

const routes: Routes = [
  {
    path: '',
    component: TeamCollaborationComponent
  }
];

@NgModule({
  declarations: [TeamCollaborationComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class TeamCollaborationModule { }