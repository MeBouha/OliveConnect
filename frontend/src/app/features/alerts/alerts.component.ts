import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AlertDataService, OrchardDataService } from '../../core/domain.services';
import { Alert, Orchard } from '../../core/models';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h1 class="page-title">Alertes</h1>
    <mat-card class="panel">
      <h3>Nouvelle alerte</h3>
      <div class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Oliveraie</mat-label>
          <mat-select [(ngModel)]="form.orchardId">
            @for (orchard of orchards; track orchard.id) { <mat-option [value]="orchard.id">{{ orchard.name }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Type</mat-label>
          <mat-select [(ngModel)]="form.type">
            @for (type of types; track type) { <mat-option [value]="type">{{ type }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Description</mat-label><input matInput [(ngModel)]="form.description" /></mat-form-field>
      </div>
      <button mat-flat-button color="primary" (click)="create()">Créer</button>
    </mat-card>
    <mat-card class="panel">
      <table>
        <thead><tr><th>Oliveraie</th><th>Type</th><th>Description</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          @for (alert of alerts; track alert.id) {
            <tr>
              <td>{{ alert.orchardId }}</td>
              <td>{{ alert.type }}</td>
              <td>{{ alert.description }}</td>
              <td>{{ alert.status }}</td>
              <td>
                @if (alert.status !== 'RESOLVED') {
                  <button mat-button color="primary" (click)="resolve(alert.id!)">Résoudre</button>
                }
              </td>
            </tr>
          } @empty { <tr><td colspan="5" class="muted">Aucune alerte</td></tr> }
        </tbody>
      </table>
    </mat-card>
  `,
  styles: [`.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }`]
})
export class AlertsComponent implements OnInit {
  private readonly service = inject(AlertDataService);
  private readonly orchardService = inject(OrchardDataService);

  readonly types = ['MATURITY_OPTIMAL', 'RAIN', 'PEST', 'OTHER'];
  alerts: Alert[] = [];
  orchards: Orchard[] = [];
  form = { orchardId: '', type: 'MATURITY_OPTIMAL', description: '' };

  ngOnInit(): void {
    this.load();
    this.orchardService.list({ size: 100 }).subscribe(result => {
      this.orchards = result.content;
      this.form.orchardId = this.orchards[0]?.id ?? '';
    });
  }

  load(): void {
    this.service.list({ size: 100 }).subscribe(result => (this.alerts = result.content));
  }

  create(): void {
    const orchard = this.orchards.find(item => item.id === this.form.orchardId);
    this.service.create({
      orchardId: this.form.orchardId,
      type: this.form.type,
      description: this.form.description,
      status: 'OPEN',
      location: orchard?.geometry ?? { type: 'Point', coordinates: [10.8, 35.2] }
    }).subscribe(() => {
      this.form.description = '';
      this.load();
    });
  }

  resolve(id: string): void {
    this.service.updateStatus(id, 'RESOLVED').subscribe(() => this.load());
  }
}
