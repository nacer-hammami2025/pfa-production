import { Component, OnInit } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';
import { AuthService } from 'src/app/services/auth.service';

interface User {
  _id: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
}

@Component({
  selector: 'app-admin-user-management',
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div class="header-content">
          <h1>👥 Gestion des Utilisateurs</h1>
          <p>Gérez les utilisateurs, leurs rôles et permissions</p>
        </div>
        <button class="btn-primary" (click)="showAddUserModal = true">
          <i>➕</i> Nouvel Utilisateur
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👤</div>
          <div class="stat-info">
            <span class="stat-value">{{totalUsers}}</span>
            <span class="stat-label">Total Utilisateurs</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👑</div>
          <div class="stat-info">
            <span class="stat-value">{{adminCount}}</span>
            <span class="stat-label">Administrateurs</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <span class="stat-value">{{userCount}}</span>
            <span class="stat-label">Utilisateurs</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🟢</div>
          <div class="stat-info">
            <span class="stat-value">{{activeUsers}}</span>
            <span class="stat-label">Actifs Aujourd'hui</span>
          </div>
        </div>
      </div>

      <!-- Search & Filter -->
      <div class="toolbar">
        <div class="search-box">
          <i class="search-icon">🔍</i>
          <input type="text" placeholder="Rechercher un utilisateur..." [(ngModel)]="searchTerm" (input)="filterUsers()">
        </div>
        <select class="filter-select" [(ngModel)]="roleFilter" (change)="filterUsers()">
          <option value="">Tous les rôles</option>
          <option value="admin">Administrateurs</option>
          <option value="user">Utilisateurs</option>
        </select>
      </div>

      <!-- Users Table -->
      <div class="card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Rôle</th>
                <th>Membre depuis</th>
                <th>Dernière connexion</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of filteredUsers">
                <td>
                  <div class="user-cell">
                    <div class="user-avatar">{{user.email.charAt(0).toUpperCase()}}</div>
                    <span>{{user.email}}</span>
                  </div>
                </td>
                <td>
                  <span class="role-badge" [class.admin]="user.role === 'admin'">
                    {{user.role === 'admin' ? '👑 Admin' : '👤 User'}}
                  </span>
                </td>
                <td>{{formatDate(user.createdAt)}}</td>
                <td>{{user.lastLogin ? formatDate(user.lastLogin) : 'Jamais'}}</td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-icon" (click)="editUser(user)" title="Modifier">✏️</button>
                    <button class="btn-icon" (click)="toggleRole(user)" title="Changer le rôle">🔄</button>
                    <button class="btn-icon danger" (click)="deleteUser(user)" title="Supprimer">🗑️</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredUsers.length === 0">
                <td colspan="5" class="empty-state">Aucun utilisateur trouvé</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-overlay">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>

      <!-- Add User Modal -->
      <div *ngIf="showAddUserModal" class="modal-overlay" (click)="showAddUserModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>➕ Créer un Utilisateur</h3>
            <button class="close-btn" (click)="showAddUserModal = false">✕</button>
          </div>
          <form (ngSubmit)="createUser()" #userForm="ngForm" class="modal-form">
            <div class="form-group">
              <label>Nom complet</label>
              <input type="text" [(ngModel)]="newUser.name" name="name" required placeholder="John Doe" class="form-input">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="newUser.email" name="email" required placeholder="user@example.com" class="form-input">
            </div>
            <div class="form-group">
              <label>Mot de passe</label>
              <input type="password" [(ngModel)]="newUser.password" name="password" required placeholder="••••••••" class="form-input">
            </div>
            <div class="form-group">
              <label>Rôle</label>
              <select [(ngModel)]="newUser.role" name="role" required class="form-input">
                <option value="user">👤 Utilisateur</option>
                <option value="admin">👑 Administrateur</option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="showAddUserModal = false">Annuler</button>
              <button type="submit" class="btn-primary" [disabled]="!userForm.valid">Créer</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit User Modal -->
      <div *ngIf="showEditUserModal" class="modal-overlay" (click)="showEditUserModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>✏️ Modifier l'Utilisateur</h3>
            <button class="close-btn" (click)="showEditUserModal = false">✕</button>
          </div>
          <form (ngSubmit)="updateUser()" class="modal-form">
            <div class="form-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="editingUser.email" name="email" required placeholder="user@example.com" class="form-input">
            </div>
            <div class="form-group">
              <label>Rôle</label>
              <select [(ngModel)]="editingUser.role" name="role" required class="form-input">
                <option value="user">👤 Utilisateur</option>
                <option value="admin">👑 Administrateur</option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="showEditUserModal = false">Annuler</button>
              <button type="submit" class="btn-primary">Mettre à jour</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      padding: 0;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 2px solid #e2e8f0;
    }

    .header-content h1 {
      font-size: 28px;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 8px 0;
    }

    .header-content p {
      color: #718096;
      margin: 0;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    .btn-primary i {
      font-style: normal;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      font-size: 40px;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #1a202c;
    }

    .stat-label {
      font-size: 14px;
      color: #718096;
    }

    .toolbar {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }

    .search-box {
      flex: 1;
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      font-style: normal;
      color: #a0aec0;
    }

    .search-box input {
      width: 100%;
      padding: 12px 16px 12px 48px;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      font-size: 15px;
      transition: all 0.3s ease;
    }

    .search-box input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .filter-select {
      padding: 12px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      font-size: 15px;
      background: white;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .filter-select:focus {
      outline: none;
      border-color: #667eea;
    }

    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }

    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table thead {
      background: #f7fafc;
    }

    .data-table th {
      padding: 16px;
      text-align: left;
      font-weight: 600;
      color: #4a5568;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .data-table td {
      padding: 16px;
      border-top: 1px solid #e2e8f0;
    }

    .data-table tbody tr {
      transition: background 0.2s ease;
    }

    .data-table tbody tr:hover {
      background: #f7fafc;
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
    }

    .role-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
      background: #e6f3ff;
      color: #0066cc;
    }

    .role-badge.admin {
      background: #fee;
      color: #c00;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .btn-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e2e8f0;
      background: white;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 16px;
    }

    .btn-icon:hover {
      background: #f7fafc;
      border-color: #667eea;
      transform: scale(1.1);
    }

    .btn-icon.danger:hover {
      background: #fee;
      border-color: #f56565;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px !important;
      color: #a0aec0;
      font-size: 16px;
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 1000;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      animation: fadeIn 0.2s ease;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #1a202c;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: #f7fafc;
      border-radius: 8px;
      font-size: 18px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #718096;
    }

    .close-btn:hover {
      background: #e2e8f0;
      color: #1a202c;
    }

    .modal-form {
      padding: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: #4a5568;
      font-size: 14px;
    }

    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      font-size: 15px;
      transition: all 0.3s ease;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }

    .modal-actions .btn-secondary {
      flex: 1;
      padding: 12px;
      background: #f7fafc;
      color: #4a5568;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .modal-actions .btn-secondary:hover {
      background: #e2e8f0;
    }

    .modal-actions .btn-primary {
      flex: 1;
      padding: 12px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .modal-actions .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    .modal-actions .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class AdminUserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm = '';
  roleFilter = '';
  loading = false;
  showAddUserModal = false;
  showEditUserModal = false;

  newUser = {
    name: '',
    email: '',
    password: '',
    role: 'user'
  };

  editingUser: any = {
    _id: '',
    email: '',
    role: 'user'
  };

  totalUsers = 0;
  adminCount = 0;
  userCount = 0;
  activeUsers = 0;

  constructor(
    private adminService: AdminService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
        this.calculateStats();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des utilisateurs:', err);
        this.loading = false;
        // Données de démonstration
        this.users = [
          { _id: '1', email: 'admin@taskflow.com', role: 'admin', createdAt: new Date().toISOString() },
          { _id: '2', email: 'user@taskflow.com', role: 'user', createdAt: new Date().toISOString() }
        ];
        this.filteredUsers = this.users;
        this.calculateStats();
      }
    });
  }

  calculateStats() {
    this.totalUsers = this.users.length;
    this.adminCount = this.users.filter(u => u.role === 'admin').length;
    this.userCount = this.users.filter(u => u.role === 'user').length;
    this.activeUsers = this.users.filter(u => u.lastLogin).length;
  }

  filterUsers() {
    this.filteredUsers = this.users.filter(user => {
      const matchesSearch = user.email.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesRole = !this.roleFilter || user.role === this.roleFilter;
      return matchesSearch && matchesRole;
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  createUser() {
    this.loading = true;
    this.adminService.createUser(this.newUser as any).subscribe({
      next: (user) => {
        this.users.push(user);
        this.filterUsers();
        this.calculateStats();
        this.showAddUserModal = false;
        this.newUser = { name: '', email: '', password: '', role: 'user' };
        alert('✅ Utilisateur créé avec succès !');
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors de la création:', err);
        alert('❌ Erreur lors de la création de l\'utilisateur');
        this.loading = false;
      }
    });
  }

  editUser(user: User) {
    this.editingUser = { ...user };
    this.showEditUserModal = true;
  }

  updateUser() {
    this.loading = true;
    this.adminService.updateUser(this.editingUser._id, {
      email: this.editingUser.email,
      role: this.editingUser.role
    }).subscribe({
      next: (updated) => {
        const index = this.users.findIndex(u => u._id === this.editingUser._id);
        if (index !== -1) {
          this.users[index] = updated;
        }
        this.filterUsers();
        this.calculateStats();
        this.showEditUserModal = false;
        alert('✅ Utilisateur mis à jour avec succès !');
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour:', err);
        alert('❌ Erreur lors de la mise à jour');
        this.loading = false;
      }
    });
  }

  toggleRole(user: User) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (confirm(`Changer le rôle de ${user.email} en ${newRole}?`)) {
      this.loading = true;
      this.adminService.updateUser(user._id, { role: newRole as any }).subscribe({
        next: () => {
          user.role = newRole;
          this.calculateStats();
          this.loading = false;
          alert(`✅ Rôle changé en ${newRole}`);
        },
        error: (err) => {
          console.error('Erreur:', err);
          alert('❌ Erreur lors du changement de rôle');
          this.loading = false;
        }
      });
    }
  }

  deleteUser(user: User) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.email}?`)) {
      this.loading = true;
      this.adminService.deleteUser(user._id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u._id !== user._id);
          this.filterUsers();
          this.calculateStats();
          this.loading = false;
          alert('✅ Utilisateur supprimé');
        },
        error: (err) => {
          console.error('Erreur:', err);
          alert('❌ Erreur lors de la suppression');
          this.loading = false;
        }
      });
    }
  }
}
