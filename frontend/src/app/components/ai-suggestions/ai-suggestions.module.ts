import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AISuggestionsComponent } from './ai-suggestions.component';

const routes: Routes = [
  {
    path: '',
    component: AISuggestionsComponent
  }
];

@NgModule({
  declarations: [AISuggestionsComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes)
  ]
})
export class AiSuggestionsModule { }
