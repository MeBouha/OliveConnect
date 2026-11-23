import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { HarvestDataService, OrchardDataService } from '../../core/domain.services';
import { Harvest, Orchard } from '../../core/models';

@Component({
  selector: 'app-harvests',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h1 class="page-title">Récoltes</h1>
    <mat-card class="panel">
      <h3>Demander une récolte</h3>
      <div class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Oliveraie</mat-label>
          <mat-select [(ngModel)]="form.orchardId">
            @for (orchard of orchards; track orchard.id) { <mat-option [value]="orchard.id">{{ orchard.name }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Type</mat-label>
          <mat-select [(ngModel)]="form.type"><mat-option value="PLANNED">Planifiée</mat-option><mat-option value="URGENT">Urgente</mat-option></mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Notes</mat-label><input matInput [(ngModel)]="form.notes" /></mat-form-field>
      </div>
      <button mat-flat-button color="primary" (click)="create()">Créer</button>
    </mat-card>
    <mat-card class="panel">
      <h3>Planifier une tournée</h3>
      <div class="form-grid">
        <mat-form-field appearance="outline"><mat-label>ID récolte</mat-label><input matInput [(ngModel)]="assign.harvestId" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Code</mat-label><input matInput [(ngModel)]="assign.code" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Date</mat-label><input matInput type="datetime-local" [(ngModel)]="assign.plannedDate" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Chef d'équipe</mat-label><input matInput [(ngModel)]="assign.teamLeaderId" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Ressources (ids séparés par virgule)</mat-label><input matInput [(ngModel)]="assign.resourceIds" /></mat-form-field>
      </div>
      <button mat-flat-button color="primary" (click)="assignTour()">Affecter</button>
    </mat-card>
    <mat-card class="panel">
      <table>
        <thead><tr><th>Oliveraie</th><th>Type</th><th>Statut</th><th>Quantité</th><th></th></tr></thead>
        <tbody>
          @for (harvest of harvests; track harvest.id) {
            <tr>
              <td>{{ harvest.orchardId }}</td>
              <td>{{ harvest.type }}</td>
              <td>{{ harvest.status }}</td>
              <td>{{ harvest.quantityKg }} kg</td>
              <td><button mat-button color="warn" (click)="cancel(harvest.id!)">Annuler</button></td>
            </tr>
          } @empty { <tr><td colspan="5" class="muted">Aucune récolte</td></tr> }
        </tbody>
      </table>
    </mat-card>
  `,
  styles: [`.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }`]
})
export class HarvestsComponent implements OnInit {
  private readonly service = inject(HarvestDataService);
  private readonly orchardService = inject(OrchardDataService);

  harvests: Harvest[] = [];
  orchards: Orchard[] = [];
  form = { orchardId: '', type: 'PLANNED', notes: '' };
  assign = { harvestId: '', code: '', plannedDate: '', teamLeaderId: 'leader-1', resourceIds: 'resource-tractor-1' };

  ngOnInit(): void {
    this.load();
    this.orchardService.list({ size: 100 }).subscribe(result => {
      this.orchards = result.content;
      this.form.orchardId = this.orchards[0]?.id ?? '';
    });
  }

  load(): void {
    this.service.list({ size: 100 }).subscribe(result => (this.harvests = result.content));
  }

  create(): void {
    this.service.create({
      orchardId: this.form.orchardId,
      type: this.form.type as Harvest['type'],
      requestedDate: new Date().toISOString(),
      quantityKg: 0,
      status: 'REQUESTED',
      notes: this.form.notes
    }).subscribe(() => this.load());
  }

  assignTour(): void {
    if (!this.assign.harvestId || !this.assign.plannedDate) {
      return;
    }
    this.service.assignTour(this.assign.harvestId, {
      code: this.assign.code,
      plannedDate: new Date(this.assign.plannedDate).toISOString(),
      teamLeaderId: this.assign.teamLeaderId,
      resourceIds: this.assign.resourceIds.split(',').map(value => value.trim()).filter(Boolean)
    }).subscribe(() => this.load());
  }

  cancel(id: string): void {
    this.service.cancel(id).subscribe(() => this.load());
  }
}
