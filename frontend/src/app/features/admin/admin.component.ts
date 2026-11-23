import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AdminDataService } from '../../core/domain.services';
import { AdminStatus, Role } from '../../core/models';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h1 class="page-title">Administration</h1>
    <mat-card class="panel">
      <h3>État du système</h3>
      @if (status) {
        <p>MongoDB : {{ status.mongoStatus }} · Uptime : {{ status.uptimeSeconds }} s · Heap : {{ status.heapUsedMb }} / {{ status.heapMaxMb }} Mo</p>
      }
    </mat-card>
    <mat-card class="panel">
      <h3>Imports</h3>
      <mat-form-field appearance="outline">
        <mat-label>Source</mat-label>
        <mat-select [(ngModel)]="source">
          <mat-option value="weather-json">weather-json</mat-option>
          <mat-option value="maturity-sensor-csv">maturity-sensor-csv</mat-option>
        </mat-select>
      </mat-form-field>
      <button mat-flat-button color="primary" (click)="trigger()">Déclencher</button>
      @if (message) { <p>{{ message }}</p> }
    </mat-card>
    <mat-card class="panel">
      <h3>Utilisateurs</h3>
      <table>
        <thead><tr><th>Email</th><th>Nom</th><th>Rôle</th><th></th></tr></thead>
        <tbody>
          @for (user of users; track user.id) {
            <tr>
              <td>{{ user.email }}</td><td>{{ user.fullName }}</td><td>{{ user.role }}</td>
              <td>
                <mat-form-field appearance="outline">
                  <mat-label>Nouveau rôle</mat-label>
                  <mat-select [(ngModel)]="roles[user.id]">
                    @for (role of roleOptions; track role) { <mat-option [value]="role">{{ role }}</mat-option> }
                  </mat-select>
                </mat-form-field>
                <button mat-button color="primary" (click)="updateRole(user.id)">Modifier</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </mat-card>
  `,
  styles: [`.mat-mdc-form-field { width: 200px; }`]
})
export class AdminComponent implements OnInit {
  private readonly service = inject(AdminDataService);

  readonly roleOptions: Role[] = ['VISITOR', 'FARMER', 'COLLECTION_MANAGER', 'TEAM_LEADER', 'LOGISTICS_MANAGER', 'PRESS_MANAGER', 'ADMIN'];
  users: AdminUser[] = [];
  roles: Record<string, Role> = {};
  status: AdminStatus | null = null;
  source = 'weather-json';
  message = '';

  ngOnInit(): void {
    this.service.users({ size: 100 }).subscribe(result => (this.users = result.content as AdminUser[]));
    this.service.status().subscribe(result => (this.status = result));
  }

  updateRole(id: string): void {
    this.service.updateRole(id, this.roles[id]).subscribe();
  }

  trigger(): void {
    this.service.triggerImport(this.source).subscribe(() => (this.message = 'Import déclenché'));
  }
}
