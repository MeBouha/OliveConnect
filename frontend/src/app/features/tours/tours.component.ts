import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TourDataService } from '../../core/domain.services';
import { Tour } from '../../core/models';

@Component({
  selector: 'app-tours',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h1 class="page-title">Tournées</h1>
    <mat-card class="panel">
      <h3>Nouvelle tournée</h3>
      <div class="form-grid">
        <mat-form-field appearance="outline"><mat-label>Code</mat-label><input matInput [(ngModel)]="form.code" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Date</mat-label><input matInput type="datetime-local" [(ngModel)]="form.plannedDate" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Chef d'équipe</mat-label><input matInput [(ngModel)]="form.teamLeaderId" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Récoltes (ids)</mat-label><input matInput [(ngModel)]="form.harvestIds" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Ressources (ids)</mat-label><input matInput [(ngModel)]="form.resourceIds" /></mat-form-field>
      </div>
      <button mat-flat-button color="primary" (click)="create()">Créer</button>
    </mat-card>
    <mat-card class="panel">
      <table>
        <thead><tr><th>Code</th><th>Date</th><th>Statut</th><th>Chef d'équipe</th><th></th></tr></thead>
        <tbody>
          @for (tour of tours; track tour.id) {
            <tr>
              <td>{{ tour.code }}</td>
              <td>{{ tour.plannedDate }}</td>
              <td>{{ tour.status }}</td>
              <td>{{ tour.teamLeaderId }}</td>
              <td>
                <button mat-button color="primary" (click)="progress(tour.id!, 'IN_PROGRESS')">Démarrer</button>
                <button mat-button (click)="progress(tour.id!, 'COMPLETED')">Terminer</button>
                <button mat-button color="warn" (click)="cancel(tour.id!)">Annuler</button>
              </td>
            </tr>
          } @empty { <tr><td colspan="5" class="muted">Aucune tournée</td></tr> }
        </tbody>
      </table>
    </mat-card>
  `,
  styles: [`.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }`]
})
export class ToursComponent implements OnInit {
  private readonly service = inject(TourDataService);

  tours: Tour[] = [];
  form = {
    code: '',
    plannedDate: '',
    teamLeaderId: 'leader-1',
    harvestIds: '',
    resourceIds: 'resource-tractor-1'
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.list({ size: 100 }).subscribe(result => (this.tours = result.content));
  }

  create(): void {
    if (!this.form.plannedDate) {
      return;
    }
    this.service.create({
      code: this.form.code,
      plannedDate: new Date(this.form.plannedDate).toISOString(),
      teamLeaderId: this.form.teamLeaderId,
      harvestIds: this.split(this.form.harvestIds),
      resourceIds: this.split(this.form.resourceIds),
      status: 'PLANNED'
    }).subscribe(() => this.load());
  }

  progress(id: string, status: string): void {
    this.service.updateProgress(id, status).subscribe(() => this.load());
  }

  cancel(id: string): void {
    this.service.cancel(id).subscribe(() => this.load());
  }

  private split(value: string): string[] {
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }
}
