import { Component, OnInit } from '@angular/core';
import { AdminService } from 'src/app/services/admin.service';

interface Team {
  _id: string;
  name: string;
  description?: string;
  members: any[];
  createdAt: string;
  leader?: string;
}

@Component({
  selector: 'app-admin-team-management',
  template: `
    <div class="admin-page">
      <div class="page-header">
        <div class="header-content">
          <h1>🏢 Gestion des Équipes</h1>
          <p>Créez et gérez les équipes de votre organisation</p>
        </div>
        <button class="btn-primary" (click)="showAddTeamModal = true">
          <i>➕</i> Nouvelle Équipe
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🏢</div>
          <div class="stat-info">
            <span class="stat-value">{{totalTeams}}</span>
            <span class="stat-label">Total Équipes</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <span class="stat-value">{{totalMembers}}</span>
            <span class="stat-label">Total Membres</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <span class="stat-value">{{averageSize}}</span>
            <span class="stat-label">Taille Moyenne</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🚀</div>
          <div class="stat-info">
            <span class="stat-value">{{activeTeams}}</span>
            <span class="stat-label">Équipes Actives</span>
          </div>
        </div>
      </div>

      <!-- Search & Filter -->
      <div class="toolbar">
        <div class="search-box">
          <i class="search-icon">🔍</i>
          <input type="text" placeholder="Rechercher une équipe..." [(ngModel)]="searchTerm" (input)="filterTeams()">
        </div>
        <select class="filter-select" [(ngModel)]="sizeFilter" (change)="filterTeams()">
          <option value="">Toutes les tailles</option>
          <option value="small">Petites (1-5)</option>
          <option value="medium">Moyennes (6-15)</option>
          <option value="large">Grandes (16+)</option>
        </select>
      </div>

      <!-- Teams Grid -->
      <div class="teams-grid">
        <div class="team-card" *ngFor="let team of filteredTeams">
          <div class="team-header">
            <div class="team-icon">🏢</div>
            <div class="team-info">
              <h3>{{team.name}}</h3>
              <p class="team-description">{{team.description || 'Aucune description'}}</p>
            </div>
          </div>
          
          <div class="team-stats">
            <div class="team-stat">
              <span class="stat-icon">👥</span>
              <span class="stat-text">{{team.members?.length || 0}} membres</span>
            </div>
            <div class="team-stat">
              <span class="stat-icon">📅</span>
              <span class="stat-text">{{formatDate(team.createdAt)}}</span>
            </div>
          </div>

          <div class="members-preview" *ngIf="team.members && team.members.length > 0">
            <div class="member-avatars">
              <div class="member-avatar" *ngFor="let member of team.members.slice(0, 5)">
                {{getMemberInitial(member)}}
              </div>
              <div class="member-avatar more" *ngIf="team.members.length > 5">
                +{{team.members.length - 5}}
              </div>
            </div>
          </div>

          <div class="team-actions">
            <button class="btn-secondary" (click)="manageMembers(team)">
              <i>👥</i> Membres
            </button>
            <button class="btn-secondary" (click)="editTeam(team)">
              <i>✏️</i> Modifier
            </button>
            <button class="btn-danger" (click)="deleteTeam(team)">
              <i>🗑️</i> Supprimer
            </button>
          </div>
        </div>

        <div class="empty-state" *ngIf="filteredTeams.length === 0">
          <div class="empty-icon">🏢</div>
          <h3>Aucune équipe trouvée</h3>
          <p>Créez votre première équipe pour commencer</p>
          <button class="btn-primary" (click)="showAddTeamModal = true">
            <i>➕</i> Créer une équipe
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-overlay">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>

      <!-- Add Team Modal -->
      <div *ngIf="showAddTeamModal" class="modal-overlay" (click)="showAddTeamModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>➕ Créer une Équipe</h3>
            <button class="close-btn" (click)="showAddTeamModal = false">✕</button>
          </div>
          <form (ngSubmit)="createTeam()" #teamForm="ngForm" class="modal-form">
            <div class="form-group">
              <label>Nom de l'équipe</label>
              <input type="text" [(ngModel)]="newTeam.name" name="name" required placeholder="Ex: Équipe Développement" class="form-input">
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="newTeam.description" name="description" rows="3" placeholder="Décrivez l'objectif de cette équipe..." class="form-input"></textarea>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="showAddTeamModal = false">Annuler</button>
              <button type="submit" class="btn-primary" [disabled]="!teamForm.valid">Créer</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Team Modal -->
      <div *ngIf="showEditTeamModal" class="modal-overlay" (click)="showEditTeamModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>✏️ Modifier l'Équipe</h3>
            <button class="close-btn" (click)="showEditTeamModal = false">✕</button>
          </div>
          <form (ngSubmit)="updateTeam()" class="modal-form">
            <div class="form-group">
              <label>Nom de l'équipe</label>
              <input type="text" [(ngModel)]="editingTeam.name" name="name" required class="form-input">
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="editingTeam.description" name="description" rows="3" class="form-input"></textarea>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" (click)="showEditTeamModal = false">Annuler</button>
              <button type="submit" class="btn-primary">Mettre à jour</button>
            </div>
          </form>
        </div>
      </div>

      <!-- View Team Modal -->
      <div *ngIf="showViewTeamModal" class="modal-overlay" (click)="showViewTeamModal = false">
        <div class="modal-content large-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>👥 Gestion des Membres</h3>
            <button class="close-btn" (click)="showViewTeamModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="team-details">
              <div class="team-name-section">
                <h4>{{viewingTeam.name}}</h4>
                <p class="team-desc">{{viewingTeam.description || 'Aucune description'}}</p>
              </div>

              <!-- Add Member Section -->
              <div class="add-member-section">
                <h5>➕ Ajouter un membre</h5>
                <div class="add-member-form">
                  <select [(ngModel)]="selectedUserId" class="member-select">
                    <option value="">Sélectionner un utilisateur...</option>
                    <option *ngFor="let user of availableUsers" [value]="user._id">
                      {{user.email}} ({{user.name}})
                    </option>
                  </select>
                  <button class="btn-primary" (click)="addMemberToTeam()" [disabled]="!selectedUserId">
                    <i>➕</i> Ajouter
                  </button>
                </div>
              </div>

              <!-- Current Members List -->
              <div class="members-list">
                <h5>Membres actuels ({{viewingTeam.members?.length || 0}})</h5>
                <div *ngIf="!viewingTeam.members || viewingTeam.members.length === 0" class="empty-members">
                  <p>👥 Aucun membre dans cette équipe</p>
                </div>
                <div class="member-item-detailed" *ngFor="let member of viewingTeam.members">
                  <div class="member-info">
                    <div class="member-avatar-large">{{getMemberInitial(member)}}</div>
                    <div class="member-details">
                      <span class="member-name">{{member.name || member.email?.split('@')[0]}}</span>
                      <span class="member-email">{{member.email || member}}</span>
                    </div>
                  </div>
                  <button class="btn-remove" (click)="removeMemberFromTeam(member)" title="Retirer du groupe">
                    <i>🗑️</i> Retirer
                  </button>
                </div>
              </div>
            </div>
          </div>
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

    .teams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 24px;
    }

    .team-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .team-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    }

    .team-header {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .team-icon {
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 12px;
      font-size: 28px;
      flex-shrink: 0;
    }

    .team-info {
      flex: 1;
      min-width: 0;
    }

    .team-info h3 {
      font-size: 20px;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 8px 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .team-description {
      font-size: 14px;
      color: #718096;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .team-stats {
      display: flex;
      gap: 16px;
      padding: 12px;
      background: #f7fafc;
      border-radius: 8px;
    }

    .team-stat {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #4a5568;
    }

    .stat-icon {
      font-size: 16px;
    }

    .members-preview {
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
    }

    .member-avatars {
      display: flex;
      gap: -8px;
    }

    .member-avatar {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-radius: 50%;
      font-weight: 600;
      font-size: 14px;
      border: 2px solid white;
      margin-left: -8px;
    }

    .member-avatar:first-child {
      margin-left: 0;
    }

    .member-avatar.more {
      background: #718096;
      font-size: 12px;
    }

    .team-actions {
      display: flex;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
    }

    .btn-secondary {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px;
      background: white;
      color: #4a5568;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
    }

    .btn-secondary:hover {
      background: #f7fafc;
      border-color: #667eea;
      color: #667eea;
    }

    .btn-secondary i {
      font-style: normal;
    }

    .btn-danger {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px;
      background: white;
      color: #e53e3e;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
    }

    .btn-danger:hover {
      background: #fff5f5;
      border-color: #f56565;
    }

    .btn-danger i {
      font-style: normal;
    }

    .empty-state {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      text-align: center;
    }

    .empty-icon {
      font-size: 80px;
      margin-bottom: 24px;
      opacity: 0.5;
    }

    .empty-state h3 {
      font-size: 24px;
      color: #1a202c;
      margin: 0 0 12px 0;
    }

    .empty-state p {
      color: #718096;
      margin: 0 0 24px 0;
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
      font-family: inherit;
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    textarea.form-input {
      resize: vertical;
      min-height: 80px;
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

    /* Team Details */
    .team-details h4 {
      font-size: 22px;
      margin: 0 0 12px 0;
      color: #1a202c;
    }

    .team-desc {
      color: #718096;
      margin-bottom: 20px;
      line-height: 1.6;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .detail-row .label {
      font-weight: 600;
      color: #4a5568;
    }

    .members-list {
      margin-top: 20px;
    }

    .members-list h5 {
      font-size: 16px;
      margin: 0 0 16px 0;
      color: #4a5568;
    }

    .member-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f7fafc;
      border-radius: 8px;
      margin-bottom: 8px;
    }

    .member-item .member-avatar {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    /* Member Management Styles */
    .large-modal {
      max-width: 700px;
    }

    .team-name-section {
      padding: 20px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-radius: 12px;
      margin-bottom: 24px;
    }

    .team-name-section h4 {
      margin: 0 0 8px 0;
      font-size: 24px;
    }

    .team-name-section .team-desc {
      margin: 0;
      opacity: 0.9;
    }

    .add-member-section {
      padding: 20px;
      background: #f7fafc;
      border-radius: 12px;
      margin-bottom: 24px;
    }

    .add-member-section h5 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a202c;
    }

    .add-member-form {
      display: flex;
      gap: 12px;
    }

    .member-select {
      flex: 1;
      padding: 12px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      background: white;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .member-select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .members-list h5 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1a202c;
    }

    .empty-members {
      text-align: center;
      padding: 40px;
      color: #718096;
    }

    .member-item-detailed {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      margin-bottom: 12px;
      transition: all 0.3s ease;
    }

    .member-item-detailed:hover {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
    }

    .member-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .member-avatar-large {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 20px;
    }

    .member-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .member-name {
      font-weight: 600;
      color: #1a202c;
      font-size: 15px;
    }

    .member-email {
      font-size: 13px;
      color: #718096;
    }

    .btn-remove {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: #fff5f5;
      color: #e53e3e;
      border: 2px solid #feb2b2;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-remove:hover {
      background: #e53e3e;
      color: white;
      border-color: #e53e3e;
    }

    .btn-remove i {
      font-style: normal;
    }
  `]
})
export class AdminTeamManagementComponent implements OnInit {
  teams: Team[] = [];
  filteredTeams: Team[] = [];
  searchTerm = '';
  sizeFilter = '';
  loading = false;
  showAddTeamModal = false;
  showEditTeamModal = false;
  showViewTeamModal = false;

  // Member management
  availableUsers: any[] = [];
  selectedUserId = '';

  newTeam = {
    name: '',
    description: ''
  };

  editingTeam: any = {
    _id: '',
    name: '',
    description: ''
  };

  viewingTeam: any = {
    _id: '',
    name: '',
    description: '',
    members: [],
    createdAt: ''
  };

  totalTeams = 0;
  totalMembers = 0;
  averageSize = 0;
  activeTeams = 0;

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {
    this.loadTeams();
    this.loadAvailableUsers();
  }

  loadAvailableUsers() {
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.availableUsers = users;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des utilisateurs:', err);
      }
    });
  }

  loadTeams() {
    this.loading = true;
    this.adminService.getAllTeams().subscribe({
      next: (adminTeams) => {
        // Transform AdminTeam[] to Team[]
        this.teams = adminTeams.map(at => ({
          _id: at._id,
          name: at.name,
          description: at.description,
          members: at.members?.map(m => ({ email: m.user?.email || 'Unknown' })) || [],
          createdAt: at.createdAt,
          leader: at.owner?.email
        }));
        this.filteredTeams = this.teams;
        this.calculateStats();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des équipes:', err);
        this.loading = false;
        // Données de démonstration
        this.teams = [
          {
            _id: '1',
            name: 'Équipe Développement',
            description: 'Équipe chargée du développement des fonctionnalités',
            members: [
              { email: 'dev1@taskflow.com' },
              { email: 'dev2@taskflow.com' },
              { email: 'dev3@taskflow.com' }
            ],
            createdAt: new Date().toISOString(),
            leader: 'dev1@taskflow.com'
          },
          {
            _id: '2',
            name: 'Équipe Design',
            description: 'Équipe UI/UX',
            members: [
              { email: 'designer1@taskflow.com' },
              { email: 'designer2@taskflow.com' }
            ],
            createdAt: new Date().toISOString()
          }
        ];
        this.filteredTeams = this.teams;
        this.calculateStats();
      }
    });
  }

  calculateStats() {
    this.totalTeams = this.teams.length;
    this.totalMembers = this.teams.reduce((sum, team) => sum + (team.members?.length || 0), 0);
    this.averageSize = this.totalTeams > 0 ? Math.round(this.totalMembers / this.totalTeams) : 0;
    this.activeTeams = this.teams.length; // Toutes les équipes sont considérées actives
  }

  filterTeams() {
    this.filteredTeams = this.teams.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                           (team.description || '').toLowerCase().includes(this.searchTerm.toLowerCase());
      
      let matchesSize = true;
      if (this.sizeFilter) {
        const size = team.members?.length || 0;
        if (this.sizeFilter === 'small') matchesSize = size <= 5;
        else if (this.sizeFilter === 'medium') matchesSize = size > 5 && size <= 15;
        else if (this.sizeFilter === 'large') matchesSize = size > 15;
      }
      
      return matchesSearch && matchesSize;
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getMemberInitial(member: any): string {
    const email = member.email || member;
    return email.charAt(0).toUpperCase();
  }

  createTeam() {
    this.loading = true;
    this.adminService.createTeam(this.newTeam).subscribe({
      next: (adminTeam) => {
        const newTeam: Team = {
          _id: adminTeam._id,
          name: adminTeam.name,
          description: adminTeam.description,
          members: adminTeam.members?.map(m => ({ email: m.user?.email || 'Unknown' })) || [],
          createdAt: adminTeam.createdAt,
          leader: adminTeam.owner?.email
        };
        this.teams.push(newTeam);
        this.filterTeams();
        this.calculateStats();
        this.showAddTeamModal = false;
        this.newTeam = { name: '', description: '' };
        alert('✅ Équipe créée avec succès !');
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors de la création:', err);
        alert('❌ Erreur lors de la création de l\'équipe');
        this.loading = false;
      }
    });
  }

  viewTeam(team: Team) {
    this.viewingTeam = { ...team };
    this.showViewTeamModal = true;
  }

  editTeam(team: Team) {
    this.editingTeam = { ...team };
    this.showEditTeamModal = true;
  }

  updateTeam() {
    this.loading = true;
    this.adminService.updateTeam(this.editingTeam._id, {
      name: this.editingTeam.name,
      description: this.editingTeam.description
    }).subscribe({
      next: (adminTeam) => {
        const index = this.teams.findIndex(t => t._id === this.editingTeam._id);
        if (index !== -1) {
          this.teams[index] = {
            _id: adminTeam._id,
            name: adminTeam.name,
            description: adminTeam.description,
            members: adminTeam.members?.map(m => ({ email: m.user?.email || 'Unknown' })) || [],
            createdAt: adminTeam.createdAt,
            leader: adminTeam.owner?.email
          };
        }
        this.filterTeams();
        this.calculateStats();
        this.showEditTeamModal = false;
        alert('✅ Équipe mise à jour avec succès !');
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour:', err);
        alert('❌ Erreur lors de la mise à jour');
        this.loading = false;
      }
    });
  }

  deleteTeam(team: Team) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'équipe "${team.name}"?`)) {
      this.loading = true;
      this.adminService.deleteTeam(team._id).subscribe({
        next: () => {
          this.teams = this.teams.filter(t => t._id !== team._id);
          this.filterTeams();
          this.calculateStats();
          this.loading = false;
          alert('✅ Équipe supprimée');
        },
        error: (err) => {
          console.error('Erreur:', err);
          alert('❌ Erreur lors de la suppression');
          this.loading = false;
        }
      });
    }
  }

  manageMembers(team: Team) {
    this.viewingTeam = { ...team };
    this.selectedUserId = '';
    this.showViewTeamModal = true;
  }

  addMemberToTeam() {
    if (!this.selectedUserId) {
      alert('⚠️ Veuillez sélectionner un utilisateur');
      return;
    }

    const selectedUser = this.availableUsers.find(u => u._id === this.selectedUserId);
    if (!selectedUser) {
      alert('❌ Utilisateur introuvable');
      return;
    }

    // Vérifier si l'utilisateur est déjà dans l'équipe
    const alreadyMember = this.viewingTeam.members?.some(
      (m: any) => m.email === selectedUser.email || m === selectedUser.email
    );

    if (alreadyMember) {
      alert('⚠️ Cet utilisateur est déjà membre de cette équipe');
      return;
    }

    this.loading = true;
    this.adminService.addTeamMember(this.viewingTeam._id, this.selectedUserId).subscribe({
      next: () => {
        // Ajouter le membre à la liste locale
        if (!this.viewingTeam.members) {
          this.viewingTeam.members = [];
        }
        this.viewingTeam.members.push({
          email: selectedUser.email,
          name: selectedUser.name,
          _id: selectedUser._id
        });

        // Mettre à jour la liste des équipes
        const teamIndex = this.teams.findIndex(t => t._id === this.viewingTeam._id);
        if (teamIndex !== -1) {
          this.teams[teamIndex].members = this.viewingTeam.members;
        }

        this.calculateStats();
        this.filterTeams();
        this.selectedUserId = '';
        this.loading = false;
        alert('✅ Membre ajouté avec succès !');
      },
      error: (err: any) => {
        console.error('Erreur lors de l\'ajout du membre:', err);
        alert('❌ Erreur lors de l\'ajout du membre');
        this.loading = false;
      }
    });
  }

  removeMemberFromTeam(member: any) {
    const memberEmail = member.email || member;
    if (!confirm(`Voulez-vous retirer ${memberEmail} de cette équipe ?`)) {
      return;
    }

    // Trouver l'ID du membre
    const memberUser = this.availableUsers.find(u => u.email === memberEmail);
    if (!memberUser) {
      alert('❌ Impossible de trouver l\'utilisateur');
      return;
    }

    this.loading = true;
    this.adminService.removeTeamMember(this.viewingTeam._id, memberUser._id).subscribe({
      next: () => {
        // Retirer le membre de la liste locale
        this.viewingTeam.members = this.viewingTeam.members.filter(
          (m: any) => (m.email || m) !== memberEmail
        );

        // Mettre à jour la liste des équipes
        const teamIndex = this.teams.findIndex(t => t._id === this.viewingTeam._id);
        if (teamIndex !== -1) {
          this.teams[teamIndex].members = this.viewingTeam.members;
        }

        this.calculateStats();
        this.filterTeams();
        this.loading = false;
        alert('✅ Membre retiré avec succès !');
      },
      error: (err: any) => {
        console.error('Erreur lors du retrait du membre:', err);
        alert('❌ Erreur lors du retrait du membre');
        this.loading = false;
      }
    });
  }
}
