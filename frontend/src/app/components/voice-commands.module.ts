import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VoiceCommandsComponent } from './voice-commands.component';

const routes: Routes = [
  {
    path: '',
    component: VoiceCommandsComponent
  }
];

@NgModule({
  declarations: [VoiceCommandsComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class VoiceCommandsModule { }
