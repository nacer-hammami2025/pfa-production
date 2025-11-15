import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TimeTrackingComponent } from './time-tracking.component';

const routes: Routes = [
  {
    path: '',
    component: TimeTrackingComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    TimeTrackingComponent,
    RouterModule.forChild(routes)
  ]
})
export class TimeTrackingModule { }
