import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FileUploadService, FileAttachment } from '../../services/file-upload.service';

@Component({
  selector: 'app-file-attachments',
  templateUrl: './file-attachments.component.html',
  styleUrls: ['./file-attachments.component.css'],
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe]
})
export class FileAttachmentsComponent implements OnInit {
  @Input() taskId!: string;
  
  attachments: FileAttachment[] = [];
  isLoading = false;
  uploadProgress = 0;
  uploadingFile: string | null = null;
  errorMessage: string | null = null;

  constructor(private fileUploadService: FileUploadService) {}

  ngOnInit(): void {
    this.loadAttachments();
  }

  loadAttachments(): void {
    if (!this.taskId) return;
    
    this.isLoading = true;
    this.fileUploadService.listFiles(this.taskId).subscribe({
      next: (response) => {
        this.attachments = response.attachments;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des fichiers:', error);
        this.errorMessage = 'Impossible de charger les fichiers';
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    
    if (!file) return;

    // Valider le fichier
    const validation = this.fileUploadService.validateFile(file);
    if (!validation.valid) {
      this.errorMessage = validation.error || 'Fichier invalide';
      return;
    }

    this.uploadFile(file);
  }

  onMultipleFilesSelected(event: any): void {
    const files: FileList = event.target.files;
    
    if (!files || files.length === 0) return;

    // Valider tous les fichiers
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      const validation = this.fileUploadService.validateFile(file);
      if (!validation.valid) {
        this.errorMessage = `${file.name}: ${validation.error}`;
        return;
      }
    }

    // Limiter à 5 fichiers
    if (fileArray.length > 5) {
      this.errorMessage = 'Maximum 5 fichiers à la fois';
      return;
    }

    this.uploadMultipleFiles(fileArray);
  }

  uploadFile(file: File): void {
    this.uploadingFile = file.name;
    this.uploadProgress = 0;
    this.errorMessage = null;

    this.fileUploadService.uploadFile(this.taskId, file).subscribe({
      next: (event) => {
        if (event.status === 'progress') {
          this.uploadProgress = event.progress;
        } else if (event.status === 'done') {
          this.uploadingFile = null;
          this.uploadProgress = 0;
          this.loadAttachments();
        }
      },
      error: (error) => {
        console.error('Erreur upload:', error);
        this.errorMessage = error.error?.message || 'Erreur lors de l\'upload';
        this.uploadingFile = null;
        this.uploadProgress = 0;
      }
    });
  }

  uploadMultipleFiles(files: File[]): void {
    this.uploadingFile = `${files.length} fichiers`;
    this.uploadProgress = 0;
    this.errorMessage = null;

    this.fileUploadService.uploadMultipleFiles(this.taskId, files).subscribe({
      next: (event) => {
        if (event.status === 'progress') {
          this.uploadProgress = event.progress;
        } else if (event.status === 'done') {
          this.uploadingFile = null;
          this.uploadProgress = 0;
          this.loadAttachments();
        }
      },
      error: (error) => {
        console.error('Erreur upload:', error);
        this.errorMessage = error.error?.message || 'Erreur lors de l\'upload';
        this.uploadingFile = null;
        this.uploadProgress = 0;
      }
    });
  }

  downloadFile(attachment: FileAttachment): void {
    this.fileUploadService.downloadFile(this.taskId, attachment.filepath);
  }

  deleteFile(attachment: FileAttachment): void {
    if (!confirm(`Supprimer le fichier "${attachment.filename}" ?`)) {
      return;
    }

    this.fileUploadService.deleteFile(this.taskId, attachment.filepath).subscribe({
      next: () => {
        this.loadAttachments();
      },
      error: (error) => {
        console.error('Erreur suppression:', error);
        this.errorMessage = 'Erreur lors de la suppression';
      }
    });
  }

  getFileIcon(attachment: FileAttachment): string {
    return this.fileUploadService.getFileIcon(attachment.mimetype);
  }

  formatFileSize(bytes: number): string {
    return this.fileUploadService.formatFileSize(bytes);
  }

  clearError(): void {
    this.errorMessage = null;
  }
}
