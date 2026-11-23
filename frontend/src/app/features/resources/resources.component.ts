import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ResourceDataService } from '../../core/domain.services';
import { Resource, SupplyView } from '../../core/models';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h1 class="page-title">Ressources</h1>
    <mat-card class="panel">
      <h3>Disponibilité</h3>
      <div class="form-grid">
        <mat-form-field appearance="outline"><mat-label>Du</mat-label><input matInput type="datetime-local" [(ngModel)]="from" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Au</mat-label><input matInput type="datetime-local" [(ngModel)]="to" /></mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Type</mat-label>
          <mat-select [(ngModel)]="type">
            <mat-option value="">Tous</mat-option>
            @for (item of types; track item) { <mat-option [value]="item">{{ item }}</mat-option> }
          </mat-select>
        </mat-form-field>
      </div>
      <button mat-flat-button color="primary" (click)="search()">Rechercher</button>
      <p>{{ available.length }} ressource(s) disponible(s)</p>
    </mat-card>
    <mat-card class="panel">
      <h3>Stocks et réapprovisionnement</h3>
      <ul>
        @for (supply of supplies; track supply.type) {
          <li>{{ supply.type }} : {{ supply.stockLevel }} / seuil {{ supply.reorderThreshold }} @if (supply.reorderNeeded) { <strong> — réapprovisionner</strong> }</li>
        }
      </ul>
    </mat-card>
    <mat-card class="panel">
      <h3>Nouvelle ressource</h3>
      <div class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Type</mat-label>
          <mat-select [(ngModel)]="form.type">
            @for (item of types; track item) { <mat-option [value]="item">{{ item }}</mat-option> }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Nom</mat-label><input matInput [(ngModel)]="form.name" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Capacité</mat-label><input matInput type="number" [(ngModel)]="form.capacity" /></mat-form-field>
      </div>
      <button mat-flat-button color="primary" (click)="create()">Ajouter</button>
    </mat-card>
    <mat-card class="panel">
      <table>
        <thead><tr><th>Nom</th><th>Type</th><th>Capacité</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          @for (resource of resources; track resource.id) {
            <tr>
              <td>{{ resource.name }}</td><td>{{ resource.type }}</td><td>{{ resource.capacity }}</td><td>{{ resource.status }}</td>
              <td><button mat-button color="warn" (click)="remove(resource.id!)">Supprimer</button></td>
            </tr>
          }
        </tbody>
      </table>
    </mat-card>
  `,
  styles: [`.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }`]
})
export class ResourcesComponent implements OnInit {
  private readonly service = inject(ResourceDataService);

  readonly types = ['WORKER', 'TRACTOR', 'BIN', 'EQUIPMENT'];
  resources: Resource[] = [];
  available: Resource[] = [];
  supplies: SupplyView[] = [];
  from = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
  to = new Date(Date.now() + 172800000).toISOString().slice(0, 16);
  type = '';
  form = { type: 'BIN', name: '', capacity: 1000 };

  ngOnInit(): void {
    this.load();
    this.service.supplies().subscribe(result => (this.supplies = result));
    this.search();
  }

  load(): void {
    this.service.list({ size: 100 }).subscribe(result => (this.resources = result.content));
  }

  search(): void {
    if (!this.from || !this.to) {
      return;
    }
    this.service.availability(new Date(this.from).toISOString(), new Date(this.to).toISOString(), this.type || undefined)
      .subscribe(result => (this.available = result));
  }

  create(): void {
    this.service.create({
      type: this.form.type,
      name: this.form.name,
      capacity: this.form.capacity,
      status: 'AVAILABLE'
    }).subscribe(() => {
      this.form.name = '';
      this.load();
    });
  }

  remove(id: string): void {
    this.service.delete(id).subscribe(() => this.load());
  }
}
