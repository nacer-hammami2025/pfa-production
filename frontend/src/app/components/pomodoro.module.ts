import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { PomodoroComponent } from './pomodoro/pomodoro.component';

const routes: Routes = [
  {
    path: '',
    component: PomodoroComponent
  }
];

@NgModule({
  declarations: [PomodoroComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class PomodoroModule { }