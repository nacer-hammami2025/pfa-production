import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface FileAttachment {
  filename: string;
  filepath: string;
  mimetype: string;
  size: number;
  uploadedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = '/api/files';

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Upload un fichier pour une tâche
   * @param taskId ID de la tâche
   * @param file Fichier à uploader
   * @returns Observable avec progression et résultat
   */
  uploadFile(taskId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/upload/${taskId}`, formData, {
      headers: this.getHeaders(),
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
          return { status: 'progress', progress };
        } else if (event.type === HttpEventType.Response) {
          return { status: 'done', body: event.body };
        }
        return { status: 'pending' };
      })
    );
  }

  /**
   * Upload plusieurs fichiers pour une tâche
   * @param taskId ID de la tâche
   * @param files Liste des fichiers
   * @returns Observable avec progression et résultat
   */
  uploadMultipleFiles(taskId: string, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    return this.http.post(`${this.apiUrl}/upload-multiple/${taskId}`, formData, {
      headers: this.getHeaders(),
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map((event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
          return { status: 'progress', progress };
        } else if (event.type === HttpEventType.Response) {
          return { status: 'done', body: event.body };
        }
        return { status: 'pending' };
      })
    );
  }

  /**
   * Télécharger un fichier
   * @param taskId ID de la tâche
   * @param filename Nom du fichier
   */
  downloadFile(taskId: string, filename: string): void {
    const token = localStorage.getItem('token');
    const url = `${this.apiUrl}/download/${taskId}/${filename}?token=${token}`;
    window.open(url, '_blank');
  }

  /**
   * Supprimer un fichier
   * @param taskId ID de la tâche
   * @param filename Nom du fichier
   * @returns Observable
   */
  deleteFile(taskId: string, filename: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${taskId}/${filename}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Lister tous les fichiers d'une tâche
   * @param taskId ID de la tâche
   * @returns Observable avec liste des fichiers
   */
  listFiles(taskId: string): Observable<{ attachments: FileAttachment[] }> {
    return this.http.get<{ attachments: FileAttachment[] }>(`${this.apiUrl}/list/${taskId}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Formater la taille du fichier
   * @param bytes Taille en bytes
   * @returns Taille formatée
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Obtenir l'icône selon le type de fichier
   * @param mimetype Type MIME du fichier
   * @returns Icône correspondante
   */
  getFileIcon(mimetype: string): string {
    if (!mimetype) return '📄';
    
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype.includes('pdf')) return '📕';
    if (mimetype.includes('word') || mimetype.includes('document')) return '📘';
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊';
    if (mimetype.includes('zip') || mimetype.includes('rar')) return '🗜️';
    if (mimetype.includes('text')) return '📝';
    
    return '📄';
  }

  /**
   * Valider un fichier avant upload
   * @param file Fichier à valider
   * @returns true si valide, sinon message d'erreur
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ];

    if (file.size > maxSize) {
      return { valid: false, error: 'Le fichier est trop volumineux (max 10MB)' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Type de fichier non supporté' };
    }

    return { valid: true };
  }
}
