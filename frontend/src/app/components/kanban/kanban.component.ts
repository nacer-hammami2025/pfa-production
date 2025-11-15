import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService } from '../../services/task.service';

interface KanbanTask {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  assignedTo?: string;
  tags?: string[];
  subtasks?: any[];
  comments?: any[];
  attachments?: any[];
}

@Component({
  selector: 'app-kanban',
  templateUrl: './kanban.component.html',
  styleUrls: ['./kanban.component.css']
})
export class KanbanComponent implements OnInit {
  todoTasks: KanbanTask[] = [];
  inProgressTasks: KanbanTask[] = [];
  doneTasks: KanbanTask[] = [];
  
  loading = false;
  showAddTaskModal = false;
  showTaskDetailModal = false;
  selectedTask: KanbanTask | null = null;
  
  newTask = {
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    status: 'todo' as 'todo' | 'in-progress' | 'done'
  };

  newSubtask = '';
  newComment = '';

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    this.taskService.getTasks().subscribe({
      next: (tasks: any[]) => {
        this.todoTasks = tasks.filter(t => t.status === 'todo' || t.status === 'pending');
        this.inProgressTasks = tasks.filter(t => t.status === 'in-progress');
        this.doneTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed');
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement tâches:', err);
        this.loading = false;
      }
    });
  }

  drop(event: CdkDragDrop<KanbanTask[]>, newStatus: 'todo' | 'in-progress' | 'done'): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      const task = event.container.data[event.currentIndex];
      this.updateTaskStatus(task._id, newStatus);
    }
  }

  updateTaskStatus(taskId: string, status: string): void {
    const apiStatus = status === 'in-progress' ? 'in-progress' : 
                     status === 'done' ? 'completed' : 'pending';
    
    this.taskService.updateTask(taskId, { status: apiStatus } as any).subscribe({
      next: () => console.log('✅ Statut mis à jour'),
      error: (err) => console.error('❌ Erreur:', err)
    });
  }

  createTask(): void {
    if (!this.newTask.title) return;
    
    this.loading = true;
    this.taskService.createTask({
      ...this.newTask,
      status: this.newTask.status === 'todo' ? 'pending' : this.newTask.status
    } as any).subscribe({
      next: (task) => {
        if (this.newTask.status === 'todo') this.todoTasks.push(task as any);
        else if (this.newTask.status === 'in-progress') this.inProgressTasks.push(task as any);
        else this.doneTasks.push(task as any);
        
        this.showAddTaskModal = false;
        this.newTask = { title: '', description: '', priority: 'medium', dueDate: '', status: 'todo' };
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
      }
    });
  }

  openTaskDetail(task: KanbanTask): void {
    this.selectedTask = task;
    this.showTaskDetailModal = true;
  }

  deleteTask(taskId: string): void {
    if (!confirm('Supprimer cette tâche ?')) return;
    
    this.taskService.deleteTask(taskId).subscribe({
      next: () => {
        this.todoTasks = this.todoTasks.filter(t => t._id !== taskId);
        this.inProgressTasks = this.inProgressTasks.filter(t => t._id !== taskId);
        this.doneTasks = this.doneTasks.filter(t => t._id !== taskId);
        this.showTaskDetailModal = false;
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return '#f56565';
      case 'medium': return '#ed8936';
      case 'low': return '#48bb78';
      default: return '#718096';
    }
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }

  // Subtasks
  addSubtask(): void {
    if (!this.newSubtask || !this.selectedTask) return;
    
    this.taskService.addSubtask(this.selectedTask._id, this.newSubtask).subscribe({
      next: (updatedTask: any) => {
        if (this.selectedTask) {
          this.selectedTask.subtasks = updatedTask.subtasks;
        }
        this.updateTaskInList(updatedTask);
        this.newSubtask = '';
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  toggleSubtask(subtaskId: string, completed: boolean): void {
    if (!this.selectedTask) return;
    
    this.taskService.updateSubtask(this.selectedTask._id, subtaskId, { completed }).subscribe({
      next: (updatedTask: any) => {
        if (this.selectedTask) {
          this.selectedTask.subtasks = updatedTask.subtasks;
        }
        this.updateTaskInList(updatedTask);
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  deleteSubtask(subtaskId: string): void {
    if (!this.selectedTask || !confirm('Supprimer cette sous-tâche ?')) return;
    
    this.taskService.deleteSubtask(this.selectedTask._id, subtaskId).subscribe({
      next: (updatedTask: any) => {
        if (this.selectedTask) {
          this.selectedTask.subtasks = updatedTask.subtasks;
        }
        this.updateTaskInList(updatedTask);
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  // Comments
  addComment(): void {
    if (!this.newComment || !this.selectedTask) return;
    
    this.taskService.addComment(this.selectedTask._id, this.newComment).subscribe({
      next: (updatedTask: any) => {
        if (this.selectedTask) {
          this.selectedTask.comments = updatedTask.comments;
        }
        this.updateTaskInList(updatedTask);
        this.newComment = '';
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  deleteComment(commentId: string): void {
    if (!this.selectedTask || !confirm('Supprimer ce commentaire ?')) return;
    
    this.taskService.deleteComment(this.selectedTask._id, commentId).subscribe({
      next: (updatedTask: any) => {
        if (this.selectedTask) {
          this.selectedTask.comments = updatedTask.comments;
        }
        this.updateTaskInList(updatedTask);
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  // Helper
  private updateTaskInList(updatedTask: any): void {
    const lists = [this.todoTasks, this.inProgressTasks, this.doneTasks];
    for (const list of lists) {
      const index = list.findIndex(t => t._id === updatedTask._id);
      if (index !== -1) {
        list[index] = updatedTask;
        break;
      }
    }
  }
}
