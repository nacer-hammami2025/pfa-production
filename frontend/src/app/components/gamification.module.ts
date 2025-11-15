import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { GamificationComponent } from './gamification/gamification.component';

const routes: Routes = [
  {
    path: '',
    component: GamificationComponent
  }
];

@NgModule({
  declarations: [GamificationComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class GamificationModule { }