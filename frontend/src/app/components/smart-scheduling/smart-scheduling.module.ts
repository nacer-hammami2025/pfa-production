import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SmartSchedulingComponent } from './smart-scheduling.component';

const routes: Routes = [
  {
    path: '',
    component: SmartSchedulingComponent
  }
];

@NgModule({
  declarations: [SmartSchedulingComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class SmartSchedulingModule { }
