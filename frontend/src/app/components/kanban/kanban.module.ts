import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { KanbanComponent } from './kanban.component';
import { KanbanRoutingModule } from './kanban-routing.module';

@NgModule({
  declarations: [KanbanComponent],
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    KanbanRoutingModule
  ]
})
export class KanbanModule { }
